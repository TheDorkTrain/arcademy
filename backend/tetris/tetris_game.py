"""
Tetris Game Logic
Handles game state, piece movement, collision detection, and scoring
"""
import random
import copy

# Tetris piece shapes (tetrominos)
SHAPES = {
    'I': [
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]]
    ],
    'O': [
        [[1, 1], [1, 1]]
    ],
    'T': [
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0], [1, 1], [1, 0]],
        [[1, 1, 1], [0, 1, 0]],
        [[0, 1], [1, 1], [0, 1]]
    ],
    'S': [
        [[0, 1, 1], [1, 1, 0]],
        [[1, 0], [1, 1], [0, 1]]
    ],
    'Z': [
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1], [1, 1], [1, 0]]
    ],
    'J': [
        [[1, 0, 0], [1, 1, 1]],
        [[1, 1], [1, 0], [1, 0]],
        [[1, 1, 1], [0, 0, 1]],
        [[0, 1], [0, 1], [1, 1]]
    ],
    'L': [
        [[0, 0, 1], [1, 1, 1]],
        [[1, 0], [1, 0], [1, 1]],
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1], [0, 1], [0, 1]]
    ]
}

# Pastel Beach Theme colors (7 unique colors)
COLORS = {
    'I': '#8BCFE5',  # Bright turquoise/cyan
    'O': '#FFB6C1',  # Soft pink
    'T': '#FFC0CB',  # Light pink
    'S': '#B0C4DE',  # Light steel blue
    'Z': '#E6BE8A',  # Peach/sandy
    'J': '#DDA0DD',  # Plum/lavender
    'L': '#FFDE59'   # Soft yellow
}


class TetrisGame:
    def __init__(self, width=10, height=20):
        self.width = width
        self.height = height
        self.board = [[None for _ in range(width)] for _ in range(height)]
        self.score = 0
        self.level = 1
        self.lines_cleared = 0
        self.game_over = False
        
        # Statistics for each piece type
        self.statistics = {piece: 0 for piece in SHAPES.keys()}
        
        # Current piece
        self.current_piece = None
        self.current_shape = None
        self.current_rotation = 0
        self.current_x = 0
        self.current_y = 0
        self.current_color = None
        
        # Next piece
        self.next_piece = None
        self.next_color = None
        
        # Hold piece
        self.hold_piece = None
        self.hold_color = None
        self.can_hold = True  # Prevent holding multiple times per piece
        
        # Initialize pieces
        self.spawn_piece()
        self.generate_next_piece()
    
    def generate_next_piece(self):
        """Generate the next piece"""
        self.next_piece = random.choice(list(SHAPES.keys()))
        self.next_color = COLORS[self.next_piece]
    
    def spawn_piece(self):
        """Spawn a new piece at the top of the board"""
        if self.next_piece:
            self.current_piece = self.next_piece
            self.current_color = self.next_color
        else:
            self.current_piece = random.choice(list(SHAPES.keys()))
            self.current_color = COLORS[self.current_piece]
        
        self.statistics[self.current_piece] += 1
        self.current_rotation = 0
        self.current_shape = SHAPES[self.current_piece][0]
        self.current_x = self.width // 2 - len(self.current_shape[0]) // 2
        self.current_y = 0
        
        # Generate next piece
        self.generate_next_piece()
        
        # Check if game over (piece spawns in occupied space)
        if self.check_collision(self.current_x, self.current_y, self.current_shape):
            self.game_over = True
    
    def check_collision(self, x, y, shape):
        """Check if a piece collides with the board or boundaries"""
        for row_idx, row in enumerate(shape):
            for col_idx, cell in enumerate(row):
                if cell:
                    new_x = x + col_idx
                    new_y = y + row_idx
                    
                    # Check boundaries
                    if new_x < 0 or new_x >= self.width or new_y >= self.height:
                        return True
                    
                    # Check collision with placed pieces
                    if new_y >= 0 and self.board[new_y][new_x] is not None:
                        return True
        return False
    
    def move_left(self):
        """Move piece left"""
        if not self.game_over and not self.check_collision(self.current_x - 1, self.current_y, self.current_shape):
            self.current_x -= 1
            return True
        return False
    
    def move_right(self):
        """Move piece right"""
        if not self.game_over and not self.check_collision(self.current_x + 1, self.current_y, self.current_shape):
            self.current_x += 1
            return True
        return False
    
    def move_down(self):
        """Move piece down, lock if collision"""
        if self.game_over:
            return False
        
        if not self.check_collision(self.current_x, self.current_y + 1, self.current_shape):
            self.current_y += 1
            self.score += 1  # Soft drop: 1 point per cell
            return True
        else:
            self.lock_piece()
            return False
    
    def hard_drop(self):
        """Drop piece to the bottom immediately"""
        if self.game_over:
            return
        
        while not self.check_collision(self.current_x, self.current_y + 1, self.current_shape):
            self.current_y += 1
            self.score += 2  # Bonus points for hard drop
        
        self.lock_piece()
    
    def rotate(self):
        """Rotate piece clockwise"""
        if self.game_over:
            return False
        
        rotations = SHAPES[self.current_piece]
        new_rotation = (self.current_rotation + 1) % len(rotations)
        new_shape = rotations[new_rotation]
        
        # Try normal rotation
        if not self.check_collision(self.current_x, self.current_y, new_shape):
            self.current_rotation = new_rotation
            self.current_shape = new_shape
            return True
        
        # Try wall kicks (shift left or right if rotation fails)
        for offset in [-1, 1, -2, 2]:
            if not self.check_collision(self.current_x + offset, self.current_y, new_shape):
                self.current_x += offset
                self.current_rotation = new_rotation
                self.current_shape = new_shape
                return True
        
        return False
    
    def lock_piece(self):
        """Lock the current piece into the board"""
        for row_idx, row in enumerate(self.current_shape):
            for col_idx, cell in enumerate(row):
                if cell:
                    board_y = self.current_y + row_idx
                    board_x = self.current_x + col_idx
                    if 0 <= board_y < self.height:
                        # Store piece type letter (I, T, O, etc.) instead of color
                        self.board[board_y][board_x] = self.current_piece
        
        # Clear lines
        self.clear_lines()
        
        # Re-enable hold for next piece
        self.can_hold = True
        
        # Spawn new piece
        self.spawn_piece()
    
    def swap_hold(self):
        """Swap current piece with held piece"""
        if self.game_over or not self.can_hold:
            return False
        
        if self.hold_piece is None:
            # First time holding - store current piece and spawn next
            self.hold_piece = self.current_piece
            self.hold_color = self.current_color
            self.spawn_piece()
        else:
            # Swap current piece with held piece
            temp_piece = self.current_piece
            temp_color = self.current_color
            
            self.current_piece = self.hold_piece
            self.current_color = self.hold_color
            self.current_rotation = 0
            self.current_shape = SHAPES[self.current_piece][0]
            self.current_x = self.width // 2 - len(self.current_shape[0]) // 2
            self.current_y = 0
            
            self.hold_piece = temp_piece
            self.hold_color = temp_color
            
            # Check if swapped piece causes game over
            if self.check_collision(self.current_x, self.current_y, self.current_shape):
                self.game_over = True
                return False
        
        # Prevent holding again until piece is locked
        self.can_hold = False
        return True
    
    def clear_lines(self):
        """Clear completed lines and update score"""
        lines_to_clear = []
        
        for y in range(self.height):
            if all(self.board[y][x] is not None for x in range(self.width)):
                lines_to_clear.append(y)
        
        if lines_to_clear:
            # Remove cleared lines
            for y in sorted(lines_to_clear, reverse=True):
                del self.board[y]
                self.board.insert(0, [None for _ in range(self.width)])
            
            # Update score
            num_lines = len(lines_to_clear)
            self.lines_cleared += num_lines
            
            # Scoring system (Nintendo/Tetris Guideline Standard)
            # Based on https://tetris.wiki/Scoring
            # Single: 40 × level
            # Double: 100 × level
            # Triple: 300 × level
            # Tetris (4 lines): 1200 × level
            # Additional scoring:
            # - Soft drop: 1 point per cell (applied in move_down)
            # - Hard drop: 2 points per cell (applied in hard_drop)
            line_scores = {1: 40, 2: 100, 3: 300, 4: 1200}
            self.score += line_scores.get(num_lines, 0) * self.level
            
            # Update level (every 10 lines)
            self.level = self.lines_cleared // 10 + 1
    
    def get_board_with_current_piece(self):
        """Get the board with the current piece rendered"""
        board_copy = copy.deepcopy(self.board)
        
        if not self.game_over and self.current_shape:
            for row_idx, row in enumerate(self.current_shape):
                for col_idx, cell in enumerate(row):
                    if cell:
                        board_y = self.current_y + row_idx
                        board_x = self.current_x + col_idx
                        if 0 <= board_y < self.height and 0 <= board_x < self.width:
                            # Store piece type letter (I, T, O, etc.) instead of color
                            board_copy[board_y][board_x] = self.current_piece
        
        return board_copy
    
    def get_ghost_y(self):
        """Calculate where the current piece would land (ghost piece position)"""
        if not self.current_shape:
            return self.current_y
        
        ghost_y = self.current_y
        while not self.check_collision(self.current_x, ghost_y + 1, self.current_shape):
            ghost_y += 1
        
        return ghost_y
    
    def get_state(self):
        """Get the current game state"""
        return {
            'board': self.board,  # Send board without current piece to avoid visual artifacts
            'score': self.score,
            'level': self.level,
            'lines': self.lines_cleared,
            'statistics': self.statistics,
            'next_piece': self.next_piece,
            'next_color': self.next_color,
            'next_shape': SHAPES[self.next_piece][0] if self.next_piece else None,
            'hold_piece': self.hold_piece,
            'hold_color': self.hold_color,
            'hold_shape': SHAPES[self.hold_piece][0] if self.hold_piece else None,
            'can_hold': self.can_hold,
            'game_over': self.game_over,
            'current_piece': self.current_piece,
            'current_shape': self.current_shape,
            'current_x': self.current_x,
            'current_y': self.current_y,
            'ghost_y': self.get_ghost_y()
        }
    
    def reset(self):
        """Reset the game"""
        self.__init__(self.width, self.height)
