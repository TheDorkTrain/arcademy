"""
DOS Game Logic
Handles complete Dos game rules including:
- Full 108-card deck
- Special cards (Skip, Reverse, Draw Two, Wild, Wild Draw Four)
- Card stacking (+2 and +4)
- DOS call validation and penalties
- Turn management for up to 8 players
"""

import random
from enum import Enum

class CardColor(Enum):
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    BLUE = "blue"
    WILD = "wild"

class CardType(Enum):
    NUMBER = "number"
    SKIP = "skip"
    REVERSE = "reverse"
    DRAW_TWO = "draw_two"
    WILD = "wild"
    WILD_DRAW_FOUR = "wild_draw_four"

class DosGame:
    def __init__(self, room_id):
        self.room_id = room_id
        self.room_name = room_id  # Default to room_id, can be customized
        self.deck = []
        self.discard_pile = []
        self.players = {}  # {socket_id: {name, hand, dos_called, position}}
        self.player_order = []
        self.current_player_index = 0
        self.direction = 1  # 1 for clockwise, -1 for counter-clockwise
        self.current_color = None
        self.draw_stack = 0  # For stacking +2 and +4 cards
        self.game_started = False
        self.winner = None
        self.last_action = ""
        self.dos_challenge_window = {}  # {player_id: timestamp}
        
    def create_deck(self):
        """Create a standard 108-card Dos deck"""
        self.deck = []
        
        # Regular colored cards
        colors = [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE]
        
        for color in colors:
            # One 0 card per color
            self.deck.append({
                'color': color.value,
                'type': CardType.NUMBER.value,
                'value': 0,
                'id': f'{color.value}_0_1'
            })
            
            # Two of each number 1-9 per color
            for num in range(1, 10):
                for i in range(2):
                    self.deck.append({
                        'color': color.value,
                        'type': CardType.NUMBER.value,
                        'value': num,
                        'id': f'{color.value}_{num}_{i+1}'
                    })
            
            # Two Skip cards per color
            for i in range(2):
                self.deck.append({
                    'color': color.value,
                    'type': CardType.SKIP.value,
                    'value': 'skip',
                    'id': f'{color.value}_skip_{i+1}'
                })
            
            # Two Reverse cards per color
            for i in range(2):
                self.deck.append({
                    'color': color.value,
                    'type': CardType.REVERSE.value,
                    'value': 'reverse',
                    'id': f'{color.value}_reverse_{i+1}'
                })
            
            # Two Draw Two cards per color
            for i in range(2):
                self.deck.append({
                    'color': color.value,
                    'type': CardType.DRAW_TWO.value,
                    'value': '+2',
                    'id': f'{color.value}_draw2_{i+1}'
                })
        
        # Wild cards
        for i in range(4):
            self.deck.append({
                'color': CardColor.WILD.value,
                'type': CardType.WILD.value,
                'value': 'wild',
                'id': f'wild_{i+1}'
            })
        
        # Wild Draw Four cards
        for i in range(4):
            self.deck.append({
                'color': CardColor.WILD.value,
                'type': CardType.WILD_DRAW_FOUR.value,
                'value': '+4',
                'id': f'wild_draw4_{i+1}'
            })
        
        random.shuffle(self.deck)
        
    def add_player(self, socket_id, name, position):
        """Add a player to the game"""
        if len(self.players) >= 8:
            return False
        
        self.players[socket_id] = {
            'name': name,
            'hand': [],
            'dos_called': False,
            'position': position,
            'card_count': 0
        }
        self.player_order.append(socket_id)
        return True
    
    def remove_player(self, socket_id):
        """Remove a player from the game"""
        if socket_id in self.players:
            del self.players[socket_id]
            if socket_id in self.player_order:
                self.player_order.remove(socket_id)
    
    def start_game(self):
        """Start the game - deal cards and set first card"""
        if len(self.players) < 2:
            return False
        
        self.create_deck()
        
        # Deal 7 cards to each player
        for socket_id in self.player_order:
            for _ in range(7):
                if self.deck:
                    card = self.deck.pop()
                    self.players[socket_id]['hand'].append(card)
            self.players[socket_id]['card_count'] = len(self.players[socket_id]['hand'])
        
        # Draw first card (can't be Wild Draw Four)
        while True:
            if self.deck:
                first_card = self.deck.pop()
                if first_card['type'] != CardType.WILD_DRAW_FOUR.value:
                    self.discard_pile.append(first_card)
                    self.current_color = first_card['color']
                    
                    # Apply first card effects
                    if first_card['type'] == CardType.SKIP.value:
                        self.current_player_index = 1
                    elif first_card['type'] == CardType.REVERSE.value:
                        self.direction = -1
                    elif first_card['type'] == CardType.DRAW_TWO.value:
                        self.draw_stack = 2
                    
                    break
                else:
                    # Put Wild Draw Four back in deck and reshuffle
                    self.deck.insert(random.randint(0, len(self.deck)), first_card)
        
        self.game_started = True
        self.last_action = "Game started!"
        return True
    
    def get_current_player(self):
        """Get the current player's socket ID"""
        if not self.player_order:
            return None
        return self.player_order[self.current_player_index]
    
    def can_play_card(self, card):
        """Check if a card can be played"""
        if not self.discard_pile:
            return False
        
        top_card = self.discard_pile[-1]
        
        # Wild cards can always be played
        if card['type'] in [CardType.WILD.value, CardType.WILD_DRAW_FOUR.value]:
            # +4 can only be played if no other valid card in hand (we'll validate this separately)
            return True
        
        # If there's a draw stack, must play +2 on +2 or +4 on +4
        if self.draw_stack > 0:
            if top_card['type'] == CardType.DRAW_TWO.value and card['type'] == CardType.DRAW_TWO.value:
                return True
            if top_card['type'] == CardType.WILD_DRAW_FOUR.value and card['type'] == CardType.WILD_DRAW_FOUR.value:
                return True
            return False
        
        # Match color
        if card['color'] == self.current_color:
            return True
        
        # Match number/type
        if card['value'] == top_card['value']:
            return True
        
        return False
    
    def play_card(self, socket_id, card_id, chosen_color=None):
        """Play a card from player's hand"""
        if not self.game_started:
            return {'success': False, 'message': 'Game not started'}
        
        if self.get_current_player() != socket_id:
            return {'success': False, 'message': 'Not your turn'}
        
        player = self.players[socket_id]
        card_index = next((i for i, c in enumerate(player['hand']) if c['id'] == card_id), None)
        
        if card_index is None:
            return {'success': False, 'message': 'Card not in hand'}
        
        card = player['hand'][card_index]
        
        if not self.can_play_card(card):
            return {'success': False, 'message': 'Cannot play this card'}
        
        # Play the card
        player['hand'].pop(card_index)
        self.discard_pile.append(card)
        
        # Handle card effects
        if card['type'] == CardType.SKIP.value:
            self.last_action = f"{player['name']} played Skip"
            self.next_turn()  # Skip next player
        elif card['type'] == CardType.REVERSE.value:
            self.direction *= -1
            self.last_action = f"{player['name']} played Reverse"
        elif card['type'] == CardType.DRAW_TWO.value:
            self.draw_stack += 2
            self.current_color = card['color']
            self.last_action = f"{player['name']} played +2 (stack: +{self.draw_stack})"
        elif card['type'] in [CardType.WILD.value, CardType.WILD_DRAW_FOUR.value]:
            if chosen_color:
                self.current_color = chosen_color
            if card['type'] == CardType.WILD_DRAW_FOUR.value:
                self.draw_stack += 4
                self.last_action = f"{player['name']} played Wild +4 (stack: +{self.draw_stack})"
            else:
                self.last_action = f"{player['name']} chose {chosen_color}"
        else:
            self.current_color = card['color']
            self.last_action = f"{player['name']} played {card['value']}"
        
        # Update card count
        player['card_count'] = len(player['hand'])
        
        # Check for win
        if len(player['hand']) == 0:
            self.winner = socket_id
            self.last_action = f"{player['name']} wins!"
            return {'success': True, 'winner': player['name']}
        
        # Check if DOS should have been called
        if len(player['hand']) == 1 and not player['dos_called']:
            self.dos_challenge_window[socket_id] = True
        
        self.next_turn()
        return {'success': True}
    
    def draw_card(self, socket_id):
        """Draw a card from the deck"""
        if self.get_current_player() != socket_id:
            return {'success': False, 'message': 'Not your turn'}
        
        player = self.players[socket_id]
        cards_to_draw = max(1, self.draw_stack)
        drawn_cards = []
        
        for _ in range(cards_to_draw):
            if not self.deck:
                self.reshuffle_deck()
            if self.deck:
                card = self.deck.pop()
                player['hand'].append(card)
                drawn_cards.append(card)
        
        player['card_count'] = len(player['hand'])
        self.draw_stack = 0
        self.last_action = f"{player['name']} drew {len(drawn_cards)} card(s)"
        
        # Reset DOS call
        player['dos_called'] = False
        
        self.next_turn()
        return {'success': True, 'cards': drawn_cards}
    
    def call_dos(self, socket_id):
        """Player calls DOS"""
        if socket_id in self.players:
            self.players[socket_id]['dos_called'] = True
            if socket_id in self.dos_challenge_window:
                del self.dos_challenge_window[socket_id]
            return {'success': True}
        return {'success': False}
    
    def challenge_dos(self, challenger_id, challenged_id):
        """Challenge a player who didn't call DOS"""
        if challenged_id in self.dos_challenge_window:
            challenged_player = self.players[challenged_id]
            if len(challenged_player['hand']) == 1 and not challenged_player['dos_called']:
                # Penalty: draw 2 cards
                for _ in range(2):
                    if self.deck:
                        card = self.deck.pop()
                        challenged_player['hand'].append(card)
                challenged_player['card_count'] = len(challenged_player['hand'])
                del self.dos_challenge_window[challenged_id]
                return {'success': True, 'message': f'{challenged_player["name"]} penalized for not calling DOS!'}
        return {'success': False, 'message': 'Invalid challenge'}
    
    def next_turn(self):
        """Move to the next player"""
        self.current_player_index = (self.current_player_index + self.direction) % len(self.player_order)
    
    def reshuffle_deck(self):
        """Reshuffle discard pile into deck"""
        if len(self.discard_pile) > 1:
            top_card = self.discard_pile.pop()
            self.deck = self.discard_pile
            self.discard_pile = [top_card]
            random.shuffle(self.deck)
    
    def get_game_state(self, socket_id):
        """Get the game state for a specific player"""
        player = self.players.get(socket_id)
        if not player:
            return None
        
        return {
            'your_hand': player['hand'],
            'your_turn': self.get_current_player() == socket_id,
            'current_player': self.players[self.get_current_player()]['name'] if self.get_current_player() else None,
            'top_card': self.discard_pile[-1] if self.discard_pile else None,
            'current_color': self.current_color,
            'draw_stack': self.draw_stack,
            'direction': 'clockwise' if self.direction == 1 else 'counter-clockwise',
            'players': [{
                'id': pid,
                'name': p['name'],
                'card_count': p['card_count'],
                'position': p['position']
            } for pid, p in self.players.items()],
            'last_action': self.last_action,
            'winner': self.players[self.winner]['name'] if self.winner else None,
            'deck_count': len(self.deck)
        }
