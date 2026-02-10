"""
Game Events Handler
Socket event handlers for active gameplay
"""

from flask import request
from flask_socketio import emit


def register_game_events(socketio, room_manager):
    """Register all game-related socket events"""
    
    @socketio.on('start_game')
    def handle_start_game():
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game:
            emit('error', {'message': 'You are not in a room'})
            return
        
        if game.player_order[0] != socket_id:
            emit('error', {'message': 'Only host can start game'})
            return
        
        if len(game.players) < 2:
            emit('error', {'message': 'Need at least 2 players'})
            return
        
        if game.start_game():
            room_code = room_manager.get_room_code(socket_id)
            state = game.get_state()
            socketio.emit('game_started', state, room=room_code)
    
    @socketio.on('player_move')
    def handle_player_move(data):
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game or not game.game_started:
            return
        
        move_x = float(data.get('move_x', 0))
        move_y = float(data.get('move_y', 0))
        game.update_player(socket_id, move_x, move_y)
        
        # Update projectiles
        room_code = room_manager.get_room_code(socket_id)
        hits = game.update_projectiles()
        for hit in hits:
            if hit.get("eliminated"):
                socketio.emit('player_eliminated', {
                    'shooter_id': hit['shooter_id'],
                    'target_id': hit['target_id']
                }, room=room_code)
        
        # Check if round should end
        if game.check_round_over():
            _end_round(socketio, game, room_code)
        else:
            _check_round_time(socketio, game, room_code)
            socketio.emit('game_update', game.get_state(), room=room_code)
    
    @socketio.on('player_aim')
    def handle_player_aim(data):
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game:
            return
        
        game.update_aim(socket_id, float(data.get('aim', 0.0)))
    
    @socketio.on('shoot')
    def handle_shoot(data):
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game or not game.game_started:
            return
        
        projectile = game.handle_shot(socket_id, float(data.get('aim', 0.0)))
        
        room_code = room_manager.get_room_code(socket_id)
        if projectile:
            socketio.emit('projectile_fired', {
                'projectile': projectile
            }, room=room_code)
        
        socketio.emit('game_update', game.get_state(), room=room_code)
    
    @socketio.on('activate_ability')
    def handle_activate_ability():
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game or not game.game_started:
            return
        
        if game.activate_ability(socket_id):
            room_code = room_manager.get_room_code(socket_id)
            socketio.emit('ability_activated', {
                'player_id': socket_id,
                'character': game.players.get(socket_id, {}).get('character')
            }, room=room_code)
            socketio.emit('game_update', game.get_state(), room=room_code)
    
    @socketio.on('request_round_end')
    def handle_round_end():
        socket_id = request.sid
        game = room_manager.get_room(socket_id)
        
        if not game:
            return
        
        if game.player_order[0] != socket_id:
            return
        
        room_code = room_manager.get_room_code(socket_id)
        _end_round(socketio, game, room_code)


def _end_round(socketio, game, room_code: str):
    """Handle round ending logic"""
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
        # Match over
        socketio.emit('match_over', {
            'results': game.match_results,
            'room_code': room_code
        }, room=room_code)


def _check_round_time(socketio, game, room_code: str):
    """Check if round time has expired"""
    if game.is_round_time_over():
        _end_round(socketio, game, room_code)
