"""
Simplified Paintball Lobby Events - V2
Single source of truth: backend game state
Clear, explicit event flow with confirmations
"""

from flask import request
from flask_socketio import emit, join_room as socketio_join_room, leave_room as socketio_leave_room
import time
import re

# Constants for validation
VALID_CHARACTERS = {'sprinter', 'guardian', 'sharpshot', 'blitzer', 'phase'}
VALID_MAPS = {'arena', 'canyon', 'forest', 'ice', 'warehouse'}

# Map and character data sent to clients
MAPS_DATA = [
    {'id': 'arena', 'name': 'Sunset Arena', 'width': 1100, 'height': 700},
    {'id': 'canyon', 'name': 'Canyon Pass', 'width': 1300, 'height': 800},
    {'id': 'forest', 'name': 'Forest Outpost', 'width': 1200, 'height': 800},
    {'id': 'ice', 'name': 'Icefield Ridge', 'width': 1150, 'height': 750},
    {'id': 'warehouse', 'name': 'Warehouse Grid', 'width': 1250, 'height': 850}
]

CHARACTERS_DATA = [
    {'id': 'sprinter', 'name': 'Sprinter', 'ability': 'Speed Boost'},
    {'id': 'guardian', 'name': 'Guardian', 'ability': 'Shield Wall'},
    {'id': 'sharpshot', 'name': 'Sharpshot', 'ability': 'Long Range'},
    {'id': 'blitzer', 'name': 'Blitzer', 'ability': 'Rapid Fire'},
    {'id': 'phase', 'name': 'Phase', 'ability': 'Phase Shift'}
]

def sanitize_text(text: str, max_length: int = 20) -> str:
    """Sanitize user input - remove dangerous characters, limit length"""
    if not text:
        return ''
    # Remove non-printable characters and limit to alphanumeric + spaces + basic punctuation
    sanitized = re.sub(r'[^\w\s\-_]', '', text)
    return sanitized[:max_length].strip()

def register_lobby_events_v2(socketio, room_manager):
    """Register simplified lobby event handlers"""
    
    # ============================================================================
    # HELPER FUNCTIONS
    # ============================================================================
    
    def _get_room_state(game):
        """Get complete room state for frontend"""
        return {
            'players': [{
                'id': socket_id,
                'name': player_data['name'],
                'character': player_data['character'],
                'position': player_data['position'],
                'is_host': (socket_id == game.player_order[0] if game.player_order else False),
                'ready': player_data.get('ready', False)
            } for socket_id, player_data in game.players.items()],
            'room_code': game.room_code,
            'room_name': game.room_name,
            'rounds_to_play': game.rounds_to_play,
            'selected_map': getattr(game, 'selected_map', None)
        }
    
    def _broadcast_room_update(room_code):
        """Send full room state to all players in room"""
        # Get game from any player in the room
        game = None
        for player_socket_id in room_manager.player_rooms:
            if room_manager.player_rooms[player_socket_id] == room_code:
                game = room_manager.get_room(player_socket_id)
                break
        
        if game:
            state = _get_room_state(game)
            socketio.emit('room_state_update', state, room=room_code)
    
    def _broadcast_lobbies():
        """Broadcast updated lobby list to all connected clients"""
        lobbies = room_manager.get_lobbies()
        socketio.emit('lobbies_list', {'lobbies': lobbies})
    
    def _send_chat(room_code, message, player='System', color='#94a3b8'):
        """Send chat message to room"""
        socketio.emit('chat_message', {
            'player': player,
            'color': color,
            'message': message,
            'timestamp': time.time()
        }, room=room_code)
    
    # ============================================================================
    # CONNECTION EVENTS
    # ============================================================================
    
    @socketio.on('connect')
    def handle_connect():
        """Client connected"""
        emit('connected', {'socket_id': request.sid})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Client disconnected - clean up"""
        socket_id = request.sid
        result = room_manager.cleanup_disconnected_player(socket_id)
        
        if result and result['removed']:
            room_code = result['room_code']
            player_name = result['player_name']
            
            # Leave Flask-SocketIO room
            socketio_leave_room(room_code)
            
            # Notify remaining players
            _send_chat(room_code, f'{player_name} left the lobby')
            _broadcast_room_update(room_code)
            
            # Update lobby list
            if result['room_empty']:
                _broadcast_lobbies()
    
    # ============================================================================
    # LOBBY LIST
    # ============================================================================
    
    @socketio.on('get_lobbies')
    def handle_get_lobbies():
        """Get list of available lobbies"""
        lobbies = room_manager.get_lobbies()
        emit('lobbies_list', {'lobbies': lobbies})
    
    # ============================================================================
    # ROOM CREATION
    # ============================================================================
    
    @socketio.on('create_room')
    def handle_create_room(data):
        """Create a new room and join it"""
        socket_id = request.sid
        player_name = sanitize_text(data.get('name', 'Player'), max_length=20)
        room_name = sanitize_text(data.get('room_name', ''), max_length=20)
        use_name_as_code = data.get('use_name_as_code', False)
        
        if not player_name:
            emit('error', {'message': 'Player name required'})
            return
        
        print(f"✓ CREATE_ROOM request from {socket_id}: name={player_name}, room_name={room_name}")
        
        # Create room in backend
        room_code, error = room_manager.create_room(
            socket_id, player_name, room_name, use_name_as_code
        )
        
        if error:
            print(f"✗ Room creation failed: {error}")
            emit('error', {'message': error})
            return
        
        print(f"✓ Room {room_code} created successfully")
        
        # Join Flask-SocketIO room
        socketio_join_room(room_code)
        
        # Get game state
        game = room_manager.get_room(socket_id)
        
        print(f"✓ Sending room_joined event to {socket_id} for room {room_code}")
        
        # Send confirmation with full room state
        emit('room_joined', {
            **_get_room_state(game),
            'maps': MAPS_DATA,
            'characters': CHARACTERS_DATA
        })
        
        # Broadcast lobby list update
        _broadcast_lobbies()
        
        print(f"✓ Room created: {room_code} by {player_name} ({socket_id})")
    
    # ============================================================================
    # ROOM JOINING
    # ============================================================================
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """Join an existing room"""
        socket_id = request.sid
        room_code = data.get('room_code', '').strip().upper()  # Always uppercase and trim
        player_name = sanitize_text(data.get('name', 'Player'), max_length=20)
        
        if not room_code:
            emit('error', {'message': 'Room code required'})
            return
        
        if not player_name:
            emit('error', {'message': 'Player name required'})
            return
        
        # Join room in backend
        success, error, player_info = room_manager.join_room(socket_id, room_code, player_name)
        
        if not success:
            emit('error', {'message': error})
            return
        
        # Join Flask-SocketIO room
        socketio_join_room(room_code)
        
        # Get game state
        game = room_manager.get_room(socket_id)
        
        # Send confirmation with full room state to joining player
        emit('room_joined', {
            **_get_room_state(game),
            'maps': MAPS_DATA,
            'characters': CHARACTERS_DATA
        })
        
        # Broadcast to ALL players in room (including the one who just joined)
        _broadcast_room_update(room_code)
        
        # Send chat notification
        _send_chat(room_code, f'{player_name} joined the lobby')
        
        # Broadcast lobby list update
        _broadcast_lobbies()
        
        print(f"✓ Player joined: {player_name} ({socket_id}) → {room_code}")
    
    # ============================================================================
    # ROOM ACTIONS
    # ============================================================================
    
    @socketio.on('select_character')
    def handle_select_character(data):
        """Player selects a character"""
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game:
            emit('error', {'message': 'Not in a room'})
            return
        
        character_id = data.get('character')
        
        # Validate character ID
        if not character_id or character_id not in VALID_CHARACTERS:
            emit('error', {'message': 'Invalid character'})
            return
        
        game.set_character(socket_id, character_id)
        
        # Broadcast updated state to ALL players
        room_code = room_manager.get_room_code(socket_id)
        _broadcast_room_update(room_code)
        
        print(f"✓ Character selected: {character_id} by {socket_id}")
    
    @socketio.on('vote_map')
    def handle_vote_map(data):
        """Player votes for a map"""
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game:
            emit('error', {'message': 'Not in a room'})
            return
        
        map_id = data.get('map')
        
        # Validate map ID
        if not map_id or map_id not in VALID_MAPS:
            emit('error', {'message': 'Invalid map'})
            return
        
        game.vote_map(socket_id, map_id)
        
        # Check if map is selected
        selected_map = game.get_winning_map()
        
        # Broadcast updated state
        room_code = room_manager.get_room_code(socket_id)
        _broadcast_room_update(room_code)
        
        if selected_map:
            _send_chat(room_code, f'Map selected: {selected_map}')
        
        print(f"✓ Map voted: {map_id} by {socket_id}")
    
    @socketio.on('leave_lobby')
    def handle_leave_lobby():
        """Player leaves the lobby"""
        socket_id = request.sid
        room_code, player_name, room_empty = room_manager.leave_room(socket_id)
        
        if not room_code:
            return
        
        # Leave Flask-SocketIO room
        socketio_leave_room(room_code)
        
        # Confirm to leaving player
        emit('left_lobby', {})
        
        if not room_empty:
            # Notify remaining players
            _send_chat(room_code, f'{player_name} left the lobby')
            _broadcast_room_update(room_code)
        
        # Update lobby list
        _broadcast_lobbies()
        
        print(f"✓ Player left: {player_name} ({socket_id}) from {room_code}")
    
    @socketio.on('send_message')
    def handle_send_message(data):
        """Player sends a chat message"""
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game:
            return
        
        player = game.get_player(socket_id)
        if not player:
            return
        
        message = sanitize_text(data.get('message', ''), max_length=200)
        
        if not message:
            return
        
        room_code = room_manager.get_room_code(socket_id)
        _send_chat(room_code, message, player.name, '#ffffff')
        
        print(f"✓ Chat: {player.name}: {message}")
    
    print("  ✓ Lobby Events V2")
