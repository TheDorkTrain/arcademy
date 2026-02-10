"""
Room Manager
Handles room creation, lobby broadcasting, and room state management
"""

import random
import string
from typing import Dict, List, Optional
from paintball_game import PaintballGame


class RoomManager:
    """Manages game rooms and lobbies"""
    
    def __init__(self):
        self.games: Dict[str, PaintballGame] = {}
        self.player_rooms: Dict[str, str] = {}  # socket_id -> room_code
    
    def generate_room_code(self) -> str:
        """Generate a unique 4-character room code"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            if code not in self.games:
                return code
    
    def create_room(self, socket_id: str, player_name: str, room_name: str = '', 
                   use_name_as_code: bool = False):
        """
        Create a new game room
        Returns: (room_code, error_message)
        """
        # Check if player is already in a room
        if socket_id in self.player_rooms:
            return None, 'You are already in a room'
        
        # Generate room code
        if use_name_as_code and room_name:
            room_code = ''.join(c for c in room_name if c.isalnum()).upper()[:20]
            if room_code in self.games:
                return None, 'A room with that name already exists'
            if not room_code:
                room_code = self.generate_room_code()
        else:
            room_code = self.generate_room_code()
        
        if not room_name:
            room_name = room_code
        
        # Create game instance
        game = PaintballGame(room_code)
        game.room_name = room_name
        game.add_player(socket_id, player_name, 0)
        
        self.games[room_code] = game
        self.player_rooms[socket_id] = room_code
        
        return room_code, None
    
    def join_room(self, socket_id: str, room_code: str, player_name: str):
        """
        Join an existing room
        Returns: (success, error_message, player_info)
        """
        room_code = room_code.upper()
        
        if room_code not in self.games:
            return False, 'Room not found', None
        
        game = self.games[room_code]
        
        if game.game_started:
            return False, 'Game already started', None
        
        # Check if player is reconnecting (same name as existing player)
        existing_socket_id = None
        for socket_id_in_game, player_data in game.players.items():
            if player_data.get('name') == player_name:
                existing_socket_id = socket_id_in_game
                break
        
        if existing_socket_id:
            # Reconnecting - update socket_id for this player
            player_data = game.players[existing_socket_id]
            del game.players[existing_socket_id]
            game.players[socket_id] = player_data
            position = player_data['position']
            
            # Clean up old player_rooms entry
            if existing_socket_id in self.player_rooms:
                del self.player_rooms[existing_socket_id]
            self.player_rooms[socket_id] = room_code
            
            return True, None, {'position': position, 'reconnecting': True}
        else:
            # New player
            if len(game.players) >= 8:
                return False, 'Room is full', None
            
            position = len(game.players)
            game.add_player(socket_id, player_name, position)
            self.player_rooms[socket_id] = room_code
            
            return True, None, {'position': position, 'reconnecting': False}
    
    def leave_room(self, socket_id: str):
        """
        Remove player from room
        Returns: (room_code, player_name, room_empty)
        """
        if socket_id not in self.player_rooms:
            return None, None, False
        
        room_code = self.player_rooms[socket_id]
        if room_code not in self.games:
            del self.player_rooms[socket_id]
            return None, None, False
        
        game = self.games[room_code]
        player_name = game.players.get(socket_id, {}).get('name', 'Unknown')
        
        game.remove_player(socket_id)
        del self.player_rooms[socket_id]
        
        # Check if room is empty
        if len(game.players) == 0:
            del self.games[room_code]
            return room_code, player_name, True
        
        return room_code, player_name, False
    
    def get_room(self, socket_id: str) -> Optional[PaintballGame]:
        """Get the game room for a socket"""
        room_code = self.player_rooms.get(socket_id)
        if room_code:
            return self.games.get(room_code)
        return None
    
    def get_room_code(self, socket_id: str) -> Optional[str]:
        """Get the room code for a socket"""
        return self.player_rooms.get(socket_id)
    
    def get_lobbies(self) -> List[dict]:
        """Get list of available lobbies"""
        lobbies = []
        for room_code, game in self.games.items():
            if not game.game_started:
                lobbies.append({
                    'room_code': room_code,
                    'room_name': game.room_name,
                    'player_count': len(game.players),
                    'max_players': 8
                })
        return lobbies
    
    def cleanup_disconnected_player(self, socket_id: str):
        """
        Handle player disconnect - remove from lobbies and active games
        Returns: dict with 'removed', 'room_code', 'player_name', 'room_empty' if cleanup occurred
        """
        if socket_id not in self.player_rooms:
            return None
        
        room_code = self.player_rooms[socket_id]
        if room_code not in self.games:
            del self.player_rooms[socket_id]
            return None
        
        game = self.games[room_code]
        player = game.get_player(socket_id)
        player_name = player.name if player else 'Unknown'
        
        # Remove player from game/lobby
        game.remove_player(socket_id)
        del self.player_rooms[socket_id]
        
        # Clean up empty room
        room_empty = len(game.players) == 0
        if room_empty:
            del self.games[room_code]
        
        return {
            'removed': True,
            'room_code': room_code,
            'player_name': player_name,
            'room_empty': room_empty
        }
