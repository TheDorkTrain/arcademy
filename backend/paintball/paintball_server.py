"""
Paintball Multiplayer Server - Refactored
Flask-SocketIO server for real-time paintball matches

This is the main entry point. Event handlers are organized in separate modules:
- room_manager.py: Room and lobby state management
- lobby_events.py: Lobby socket event handlers
- game_events.py: Active gameplay socket event handlers
"""

from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

from room_manager import RoomManager
from lobby_events_v2 import register_lobby_events_v2
from game_events import register_game_events

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'paintball-secret-key'
CORS(app)

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=True
)

# Initialize room manager
room_manager = RoomManager()

# Register event handlers
register_lobby_events_v2(socketio, room_manager)
register_game_events(socketio, room_manager)


if __name__ == '__main__':
    print("=" * 60)
    print("PAINTBALL SERVER STARTING")
    print("=" * 60)
    print("Server: http://localhost:5006")
    print("WebSocket: ws://localhost:5006")
    print("-" * 60)
    print("Modules loaded:")
    print("  ✓ Room Manager")
    print("  ✓ Lobby Events")
    print("  ✓ Game Events")
    print("=" * 60)
    
    socketio.run(
        app,
        host='0.0.0.0',
        port=5006,
        debug=True,
        allow_unsafe_werkzeug=True
    )
