"""
Paintball Multiplayer Server
Flask-SocketIO server for real-time paintball matches
"""

import time
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS

from paintball_game import PaintballGame, MAPS, CHARACTERS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'paintball-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active game rooms
games = {}
player_rooms = {}


def generate_room_code():
    import random
    import string
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if code not in games:
            return code


@socketio.on('connect')
def handle_connect():
    emit('connected', {'socket_id': request.sid})


@socketio.on('disconnect')
def handle_disconnect():
    socket_id = request.sid
    if socket_id in player_rooms:
        room_code = player_rooms[socket_id]
        if room_code in games:
            game = games[room_code]
            game.remove_player(socket_id)
            socketio.emit('player_left', {
                'player_name': game.players.get(socket_id, {}).get('name', 'Unknown'),
                'players': _players_list(game)
            }, room=room_code)
            if len(game.players) == 0:
                del games[room_code]
        del player_rooms[socket_id]


@socketio.on('create_room')
def handle_create_room(data):
    socket_id = request.sid
    player_name = data.get('name', 'Player')
    room_name = data.get('room_name', '')
    use_name_as_code = data.get('use_name_as_code', False)

    if use_name_as_code and room_name:
        room_code = ''.join(c for c in room_name if c.isalnum()).upper()[:20]
        if room_code in games:
            emit('error', {'message': 'A room with that name already exists'})
            return
        if not room_code:
            room_code = generate_room_code()
    else:
        room_code = generate_room_code()

    if not room_name:
        room_name = room_code

    game = PaintballGame(room_code)
    game.room_name = room_name
    game.add_player(socket_id, player_name, 0)

    games[room_code] = game
    player_rooms[socket_id] = room_code
    join_room(room_code)

    emit('room_created', {
        'room_code': room_code,
        'room_name': room_name,
        'player_name': player_name,
        'position': 0,
        'players': _players_list(game),
        'maps': _maps_payload(),
        'characters': _characters_payload(),
        'rounds_to_play': game.rounds_to_play
    })


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
    game.add_player(socket_id, player_name, position)

    player_rooms[socket_id] = room_code
    join_room(room_code)

    socketio.emit('player_joined', {
        'player_name': player_name,
        'players': _players_list(game)
    }, room=room_code)

    emit('room_joined', {
        'room_code': room_code,
        'room_name': game.room_name,
        'player_name': player_name,
        'position': position,
        'players': _players_list(game),
        'maps': _maps_payload(),
        'characters': _characters_payload(),
        'rounds_to_play': game.rounds_to_play
    })


@socketio.on('update_lobby_settings')
def handle_update_lobby_settings(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        emit('error', {'message': 'You are not in a room'})
        return
    game = games[room_code]
    if game.player_order[0] != socket_id:
        emit('error', {'message': 'Only host can update settings'})
        return
    rounds_to_play = int(data.get('rounds_to_play', game.rounds_to_play))
    game.update_rounds(rounds_to_play)
    socketio.emit('lobby_settings', {
        'rounds_to_play': game.rounds_to_play
    }, room=room_code)


@socketio.on('select_character')
def handle_select_character(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    character_id = data.get('character')
    game = games[room_code]
    game.set_character(socket_id, character_id)
    socketio.emit('player_update', {
        'players': _players_list(game)
    }, room=room_code)


@socketio.on('vote_map')
def handle_vote_map(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    game = games[room_code]
    game.vote_map(socket_id, data.get('map_id'))
    socketio.emit('map_votes', {
        'votes': game.map_votes
    }, room=room_code)


@socketio.on('start_game')
def handle_start_game():
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        emit('error', {'message': 'You are not in a room'})
        return
    game = games[room_code]
    if game.player_order[0] != socket_id:
        emit('error', {'message': 'Only host can start game'})
        return
    if len(game.players) < 2:
        emit('error', {'message': 'Need at least 2 players'})
        return
    if game.start_game():
        state = game.get_state()
        socketio.emit('game_started', state, room=room_code)


@socketio.on('player_move')
def handle_player_move(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    game = games[room_code]
    if not game.game_started:
        return
    move_x = float(data.get('move_x', 0))
    move_y = float(data.get('move_y', 0))
    game.update_player(socket_id, move_x, move_y)
    _check_round_time(game, room_code)
    socketio.emit('game_update', game.get_state(), room=room_code)


@socketio.on('player_aim')
def handle_player_aim(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    game = games[room_code]
    game.update_aim(socket_id, float(data.get('aim', 0.0)))


@socketio.on('shoot')
def handle_shoot(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    game = games[room_code]
    if not game.game_started:
        return
    hit_target = game.handle_shot(socket_id, float(data.get('aim', 0.0)))
    if hit_target:
        socketio.emit('player_hit', {
            'shooter': socket_id,
            'target': hit_target,
            'shooter_name': game.players.get(socket_id, {}).get('name', 'Player'),
            'target_name': game.players.get(hit_target, {}).get('name', 'Player')
        }, room=room_code)
    _check_round_time(game, room_code)
    socketio.emit('game_update', game.get_state(), room=room_code)


@socketio.on('chat_message')
def handle_chat_message(data):
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    game = games[room_code]
    message = data.get('message', '').strip()
    if not message:
        return
    socketio.emit('chat_message', {
        'player': game.players.get(socket_id, {}).get('name', 'Player'),
        'message': message,
        'timestamp': time.time()
    }, room=room_code)


@socketio.on('request_round_end')
def handle_round_end():
    socket_id = request.sid
    room_code = player_rooms.get(socket_id)
    if not room_code or room_code not in games:
        return
    game = games[room_code]
    if game.player_order[0] != socket_id:
        return
    _end_round(game, room_code)


def _end_round(game: PaintballGame, room_code: str):
    result = game.end_round()
    if result is None:
        return
    winner, scores = result
    socketio.emit('round_ended', {
        'round': game.current_round,
        'winner': winner,
        'scores': scores
    }, room=room_code)

    if game.advance_round():
        socketio.emit('round_started', game.get_state(), room=room_code)
    else:
        socketio.emit('match_over', {
            'results': game.match_results
        }, room=room_code)


def _check_round_time(game: PaintballGame, room_code: str):
    if game.is_round_time_over():
        _end_round(game, room_code)


def _players_list(game: PaintballGame):
    return [
        {
            'id': pid,
            'name': p['name'],
            'position': p['position'],
            'character': p['character'],
            'is_host': i == 0
        }
        for i, (pid, p) in enumerate(game.players.items())
    ]


def _maps_payload():
    return [
        {
            'id': m.map_id,
            'name': m.name,
            'width': m.width,
            'height': m.height
        }
        for m in MAPS
    ]


def _characters_payload():
    return [
        {
            'id': cid,
            'name': info['name'],
            'ability': info['ability']
        }
        for cid, info in CHARACTERS.items()
    ]


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5006, debug=True, allow_unsafe_werkzeug=True)
