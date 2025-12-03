"""
Flask server for Tetris game
Provides REST API and WebSocket communication
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from tetris_game import TetrisGame
import threading
import time
import json
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store game instances per session
games = {}
game_timers = {}

# High scores storage
HIGH_SCORES_FILE = 'high_scores.json'

def load_high_scores():
    """Load high scores from file"""
    if os.path.exists(HIGH_SCORES_FILE):
        try:
            with open(HIGH_SCORES_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_high_scores(scores):
    """Save high scores to file"""
    try:
        with open(HIGH_SCORES_FILE, 'w') as f:
            json.dump(scores, f, indent=2)
    except Exception as e:
        print(f"Error saving high scores: {e}")


@app.route('/api/high_scores', methods=['GET'])
def get_high_scores():
    """Get high scores list"""
    scores = load_high_scores()
    # Sort by score descending and return top 10
    scores.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({'high_scores': scores[:10]})


@app.route('/api/high_scores', methods=['POST'])
def add_high_score():
    """Add a new high score"""
    data = request.json
    initials = data.get('initials', '').upper()[:3]
    score = data.get('score', 0)
    
    if not initials or len(initials) != 3:
        return jsonify({'error': 'Invalid initials'}), 400
    
    scores = load_high_scores()
    scores.append({
        'initials': initials,
        'score': score
    })
    
    # Sort and keep top 10
    scores.sort(key=lambda x: x['score'], reverse=True)
    scores = scores[:10]
    
    save_high_scores(scores)
    
    return jsonify({'success': True, 'high_scores': scores})


def auto_drop(game_id):
    """Automatically drop piece at intervals based on level"""
    while game_id in games:
        game = games[game_id]
        if not game.game_over:
            # Drop speed increases with level
            drop_interval = max(0.1, 1.0 - (game.level - 1) * 0.05)
            time.sleep(drop_interval)
            
            game.move_down()
            socketio.emit('game_update', game.get_state(), broadcast=True)
        else:
            break


@app.route('/api/new_game', methods=['POST'])
def new_game():
    """Create a new game instance"""
    game_id = request.json.get('game_id', 'default')
    
    # Stop existing timer if any
    if game_id in game_timers:
        game_timers[game_id] = None
    
    games[game_id] = TetrisGame()
    
    return jsonify({
        'game_id': game_id,
        'state': games[game_id].get_state()
    })


@app.route('/api/game/<game_id>', methods=['GET'])
def get_game_state(game_id):
    """Get current game state"""
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    return jsonify(games[game_id].get_state())


@app.route('/api/game/<game_id>/move', methods=['POST'])
def move_piece(game_id):
    """Move the current piece"""
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = games[game_id]
    action = request.json.get('action')
    
    if action == 'left':
        game.move_left()
    elif action == 'right':
        game.move_right()
    elif action == 'down':
        game.move_down()
    elif action == 'rotate':
        game.rotate()
    elif action == 'hard_drop':
        game.hard_drop()
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    return jsonify(games[game_id].get_state())


@app.route('/api/game/<game_id>/reset', methods=['POST'])
def reset_game(game_id):
    """Reset the game"""
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    games[game_id].reset()
    return jsonify(games[game_id].get_state())


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connected', {'message': 'Connected to Tetris server'})


@socketio.on('start_game')
def handle_start_game(data):
    """Start a new game with auto-drop"""
    game_id = data.get('game_id', 'default')
    
    # Create new game
    games[game_id] = TetrisGame()
    
    # Start auto-drop thread
    if game_id in game_timers:
        game_timers[game_id] = None
    
    timer_thread = threading.Thread(target=auto_drop, args=(game_id,))
    timer_thread.daemon = True
    timer_thread.start()
    game_timers[game_id] = timer_thread
    
    emit('game_update', games[game_id].get_state())


@socketio.on('move')
def handle_move(data):
    """Handle piece movement"""
    game_id = data.get('game_id', 'default')
    action = data.get('action')
    
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    
    if action == 'left':
        game.move_left()
    elif action == 'right':
        game.move_right()
    elif action == 'down':
        game.move_down()
    elif action == 'rotate':
        game.rotate()
    elif action == 'hard_drop':
        game.hard_drop()
    elif action == 'hold':
        game.swap_hold()
    
    emit('game_update', game.get_state())


@socketio.on('reset')
def handle_reset(data):
    """Reset the game"""
    game_id = data.get('game_id', 'default')
    
    if game_id in games:
        games[game_id].reset()
        emit('game_update', games[game_id].get_state())


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


if __name__ == '__main__':
    print("\n" + "="*50)
    print("TETRIS GAME SERVER")
    print("="*50)
    print("Starting server on http://0.0.0.0:5003")
    print("WebSocket endpoint: ws://localhost:5003")
    print("="*50 + "\n")
    
    # Set debug=False for production use
    # Running on port 5003 to avoid conflicts with other Arcademy services
    try:
        socketio.run(app, debug=False, host='0.0.0.0', port=5003, allow_unsafe_werkzeug=True)
    except Exception as e:
        print("\nERROR: Failed to start Tetris server:", str(e))
        print("Make sure port 5003 is not already in use.")
        raise
