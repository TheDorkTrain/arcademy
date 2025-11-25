from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sys

class LoveJSHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # CRITICAL: These headers enable SharedArrayBuffer which love.js requires
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        
        # Cache control
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        
        SimpleHTTPRequestHandler.end_headers(self)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[LoveJS Server] {format % args}")

if __name__ == '__main__':
    # Serve from current directory (already in crabAttacks)
    print(f"Love.js server starting...")
    print(f"Serving files from: {os.getcwd()}")
    print(f"Make sure you have:")
    print(f"  - index.html")
    print(f"  - player.js")
    print(f"  - game.data, game.js, game.wasm")
    print(f"  - 11.5/release/love.js (or your version folder)")
    print(f"  - your .love file")
    
    port = 8080
    server_address = ('', port)
    httpd = HTTPServer(server_address, LoveJSHandler)
    
    print(f"\nServer running on http://localhost:{port}")
    print(f"Test URL: http://localhost:{port}/index.html?g=mygame.love")
    print("Press Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()
        sys.exit(0)