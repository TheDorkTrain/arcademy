"""
DOS Multiplayer Server
Flask-SocketIO server for real-time Dos multiplayer
Handles rooms, player connections, and game events
"""

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string
from dos_game import DosGame

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dos-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active game rooms
games = {}  # {room_code: DosGame instance}
player_rooms = {}  # {socket_id: room_code}

def generate_room_code():
    """Generate a unique 4-character room code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if code not in games:
            return code

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'socket_id': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    socket_id = request.sid
    print(f'Client disconnected: {socket_id}')
    
    # Remove player from their room
    if socket_id in player_rooms:
        room_code = player_rooms[socket_id]
        if room_code in games:
            game = games[room_code]
            game.remove_player(socket_id)
            
            # Notify other players
            socketio.emit('player_left', {
                'player_name': game.players.get(socket_id, {}).get('name', 'Unknown'),
                'players': list(game.players.keys())
            }, room=room_code)
            
            # Delete room if empty
            if len(game.players) == 0:
                del games[room_code]
        
        del player_rooms[socket_id]

@socketio.on('create_room')
def handle_create_room(data):
    socket_id = request.sid
    player_name = data.get('name', 'Player')
    room_name = data.get('room_name', '')
    use_name_as_code = data.get('use_name_as_code', False)
    
    # Generate room code - use room name if provided and requested, otherwise random
    if use_name_as_code and room_name:
        # Sanitize room name to be a valid code (uppercase, alphanumeric, max 20 chars)
        room_code = ''.join(c for c in room_name if c.isalnum()).upper()[:20]
        # Check if code already exists
        if room_code in games:
            emit('error', {'message': 'A room with that name already exists'})
            return
        if not room_code:  # If sanitization resulted in empty string
            room_code = generate_room_code()
    else:
        room_code = generate_room_code()
    
    # Use room_code as display name if no custom name provided
    if not room_name:
        room_name = room_code
    
    # Create new game
    game = DosGame(room_code)
    game.room_name = room_name
    position = 0  # Host is position 0
    game.add_player(socket_id, player_name, position)
    
    games[room_code] = game
    player_rooms[socket_id] = room_code
    
    join_room(room_code)
    
    emit('room_created', {
        'room_code': room_code,
        'room_name': room_name,
        'player_name': player_name,
        'position': position,
        'players': [{
            'id': socket_id,
            'name': player_name,
            'position': position,
            'is_host': True
        }]
    })
    
    print(f'Room created: {room_code} ({room_name}) by {player_name}')

@socketio.on('join_room')
def handle_join_room(data):
    socket_id = request.sid
    room_code = data.get('room_code', '').upper()
    player_name = data.get('name', 'Player')
    
    if room_code not in games:
        emit('error', {'message': 'Room not found'})
        return
    
    game = games[room_code]
    
    if game.game_started:
        emit('error', {'message': 'Game already started'})
        return
    
    if len(game.players) >= 8:
        emit('error', {'message': 'Room is full'})
        return
    
    position = len(game.players)
    success = game.add_player(socket_id, player_name, position)
    
    if not success:
        emit('error', {'message': 'Could not join room'})
        return
    
    player_rooms[socket_id] = room_code
    join_room(room_code)
    
    # Notify all players in room
    players_list = [{
        'id': pid,
        'name': p['name'],
        'position': p['position'],
        'is_host': i == 0
    } for i, (pid, p) in enumerate(game.players.items())]
    
    socketio.emit('player_joined', {
        'player_name': player_name,
        'players': players_list
    }, room=room_code)
    
    emit('room_joined', {
        'room_code': room_code,
        'room_name': getattr(game, 'room_name', room_code),
        'player_name': player_name,
        'position': position,
        'players': players_list
    })
    
    print(f'{player_name} joined room: {room_code}')

@socketio.on('play_again')
def handle_play_again(data):
    socket_id = request.sid
    room_code = data.get('room_code')
    room_name = data.get('room_name')
    
    if not room_code or room_code not in games:
        emit('error', {'message': 'Invalid room code'})
        return
    
    game = games[room_code]
    
    # Reset game state while keeping players and room info
    player_ids = list(game.player_order)
    player_data = {pid: game.players[pid].copy() for pid in player_ids}
    
    # Create fresh game instance (but don't start it)
    new_game = DosGame(room_code)
    new_game.room_name = room_name or game.room_name
    
    # Re-add all players with their original positions
    for i, pid in enumerate(player_ids):
        new_game.add_player(pid, player_data[pid]['name'], i)
    
    # Replace game instance
    games[room_code] = new_game
    
    # Send everyone back to lobby (don't auto-start)
    players_list = [{
        'id': pid,
        'name': new_game.players[pid]['name'],
        'position': new_game.players[pid]['position'],
        'is_host': i == 0
    } for i, pid in enumerate(player_ids)]
    
    for player_id in player_ids:
        socketio.emit('lobby_reset', {
            'room_code': room_code,
            'room_name': new_game.room_name,
            'players': players_list
        }, room=player_id)
    
    print(f'Game reset to lobby in room: {room_code}')

@socketio.on('start_game')
def handle_start_game():
    socket_id = request.sid
    
    if socket_id not in player_rooms:
        emit('error', {'message': 'You are not in a game room. Please create or join a room first.'})
        return
    
    room_code = player_rooms[socket_id]
    game = games[room_code]
    
    # Only host can start game (first player)
    if game.player_order[0] != socket_id:
        emit('error', {'message': 'Only host can start game'})
        return
    
    if len(game.players) < 2:
        emit('error', {'message': 'Need at least 2 players'})
        return
    
    success = game.start_game()
    
    if success:
        # Send game state to all players
        for player_id in game.player_order:
            game_state = game.get_game_state(player_id)
            socketio.emit('game_started', game_state, room=player_id)
        
        print(f'Game started in room: {room_code}')

@socketio.on('play_card')
def handle_play_card(data):
    socket_id = request.sid
    
    if socket_id not in player_rooms:
        emit('error', {'message': 'You are not in an active game. Please join or create a room to play.'})
        return
    
    room_code = player_rooms[socket_id]
    game = games[room_code]
    
    card_id = data.get('card_id')
    chosen_color = data.get('color')
    
    result = game.play_card(socket_id, card_id, chosen_color)
    
    if result['success']:
        # Update all players
        for player_id in game.player_order:
            game_state = game.get_game_state(player_id)
            socketio.emit('game_update', game_state, room=player_id)
        
        # Check for winner
        if 'winner' in result:
            socketio.emit('game_over', {
                'winner': result['winner']
            }, room=room_code)
    else:
        emit('error', {'message': result.get('message', 'Could not play card')})

@socketio.on('draw_card')
def handle_draw_card():
    socket_id = request.sid
    
    if socket_id not in player_rooms:
        emit('error', {'message': 'You are not in an active game. Please join or create a room to play.'})
        return
    
    room_code = player_rooms[socket_id]
    game = games[room_code]
    
    result = game.draw_card(socket_id)
    
    if result['success']:
        # Update all players
        for player_id in game.player_order:
            game_state = game.get_game_state(player_id)
            socketio.emit('game_update', game_state, room=player_id)
    else:
        emit('error', {'message': result.get('message', 'Could not draw card')})

@socketio.on('call_dos')
def handle_call_dos():
    socket_id = request.sid
    
    if socket_id not in player_rooms:
        emit('error', {'message': 'You are not in an active game. Please join or create a room to play.'})
        return
    
    room_code = player_rooms[socket_id]
    game = games[room_code]
    
    result = game.call_dos(socket_id)
    
    if result['success']:
        player_name = game.players[socket_id]['name']
        socketio.emit('dos_called', {
            'player_name': player_name
        }, room=room_code)

@socketio.on('challenge_dos')
def handle_challenge_dos(data):
    socket_id = request.sid
    challenged_id = data.get('challenged_id')
    
    if socket_id not in player_rooms:
        emit('error', {'message': 'You are not in an active game. Please join or create a room to play.'})
        return
    
    room_code = player_rooms[socket_id]
    game = games[room_code]
    
    result = game.challenge_dos(socket_id, challenged_id)
    
    if result['success']:
        socketio.emit('challenge_result', {
            'message': result['message']
        }, room=room_code)
        
        # Update game state
        for player_id in game.player_order:
            game_state = game.get_game_state(player_id)
            socketio.emit('game_update', game_state, room=player_id)
    else:
        emit('error', {'message': result.get('message', 'Challenge failed')})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5004, debug=True, allow_unsafe_werkzeug=True)
