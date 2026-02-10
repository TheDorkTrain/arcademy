"""
Test script to verify lobby broadcasting in Paintball server
Run this while the paintball server is running
"""

import socketio
import time

# Create a Socket.IO client
sio = socketio.Client()

lobbies_received = []

@sio.on('connect')
def on_connect():
    print('✅ Connected to server')
    print('   Requesting lobbies...')
    sio.emit('get_lobbies')

@sio.on('connected')
def on_connected(data):
    print(f'   Server confirmed connection: {data}')

@sio.on('lobbies_list')
def on_lobbies_list(data):
    global lobbies_received
    lobbies = data.get('lobbies', [])
    lobbies_received.append(lobbies)
    print(f'\n📋 Received lobbies list: {len(lobbies)} lobbies')
    for lobby in lobbies:
        print(f'   - {lobby["room_name"]} ({lobby["room_code"]}): {lobby["player_count"]}/{lobby["max_players"]} players')

@sio.on('room_created')
def on_room_created(data):
    print(f'\n✅ Room created: {data["room_code"]} ({data["room_name"]})')

@sio.on('disconnect')
def on_disconnect():
    print('❌ Disconnected from server')

def main():
    try:
        print('Connecting to Paintball server at http://localhost:5006...')
        sio.connect('http://localhost:5006')
        
        # Wait a bit for initial connection
        time.sleep(1)
        
        # Request lobbies again
        print('\n🔄 Requesting lobbies again...')
        sio.emit('get_lobbies')
        time.sleep(1)
        
        # Create a test room
        print('\n🎯 Creating test room...')
        sio.emit('create_room', {
            'name': 'TestPlayer',
            'room_name': 'Test Lobby',
            'use_name_as_code': False
        })
        time.sleep(2)
        
        # Request lobbies one more time
        print('\n🔄 Requesting lobbies after room creation...')
        sio.emit('get_lobbies')
        time.sleep(1)
        
        print(f'\n📊 Summary: Received {len(lobbies_received)} lobby updates')
        for i, lobbies in enumerate(lobbies_received, 1):
            print(f'   Update {i}: {len(lobbies)} lobbies')
        
        # Keep connection open for a bit to see broadcast updates
        print('\n⏳ Waiting 5 seconds to observe any broadcasts...')
        time.sleep(5)
        
    except Exception as e:
        print(f'❌ Error: {e}')
    finally:
        if sio.connected:
            print('\n👋 Disconnecting...')
            sio.disconnect()

if __name__ == '__main__':
    main()
