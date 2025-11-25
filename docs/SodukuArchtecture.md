# Architecture Documentation

## Overview

This Sudoku game follows a modular, clean architecture designed for easy integration into web applications (Flask/FastAPI) or larger game hub systems.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         game.py (Console Interface)              │  │
│  │     - User Input/Output                          │  │
│  │     - Command Processing                         │  │
│  │     - Game Flow Control                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Business Logic Layer                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ generator.py │  │  solver.py   │  │validator.py  │ │
│  │              │  │              │  │              │ │
│  │ - Puzzle     │  │ - Backtrack  │  │ - Rule      │ │
│  │   Creation   │  │   Solving    │  │   Checking  │ │
│  │ - Difficulty │  │ - Solution   │  │ - Board     │ │
│  │   Levels     │  │   Verify     │  │   Validity  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            board.py (Data Model)                 │  │
│  │  - Board State Management                        │  │
│  │  - Cell Operations                               │  │
│  │  - State Tracking                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### 1. **board.py** (Data Layer)
- **Purpose:** Manages game state and board representation
- **Key Components:**
  - `SudokuBoard` class
  - Board display and formatting
  - Cell-level operations (get, set, clear)
  - Fixed cell tracking
- **Dependencies:** None (core data structure)

### 2. **validator.py** (Business Logic)
- **Purpose:** Enforces Sudoku rules and validates moves
- **Key Functions:**
  - `is_valid_number()` - Check if a move is legal
  - `validate_board()` - Check entire board for violations
  - `is_board_solved()` - Verify complete solution
  - `find_empty_cell()` - Locate next cell to fill
- **Dependencies:** None (pure logic)

### 3. **solver.py** (Business Logic)
- **Purpose:** Solves puzzles using backtracking algorithm
- **Key Functions:**
  - `solve_sudoku()` - Recursive backtracking solver
  - `has_unique_solution()` - Verify puzzle uniqueness
  - `get_solution()` - Get solution without modifying original
  - `is_solvable()` - Check if puzzle can be solved
- **Dependencies:** `validator.py`

### 4. **generator.py** (Business Logic)
- **Purpose:** Creates new puzzles with varying difficulty
- **Key Functions:**
  - `generate_complete_board()` - Create filled valid board
  - `create_puzzle()` - Remove cells for difficulty
  - `generate_puzzle()` - Public API for puzzle generation
  - `get_hint()` - Provide hints to players
- **Dependencies:** `validator.py`, `solver.py`

### 5. **game.py** (Presentation Layer)
- **Purpose:** Handles user interaction and game flow
- **Key Components:**
  - `SudokuGame` class - Main controller
  - Command parsing and processing
  - Console display and clearing
  - Game state management
- **Dependencies:** All other modules

## Integration Patterns

### For Flask/FastAPI Integration

```python
# Example Flask API Integration
from flask import Flask, jsonify, request
from Sudoku.generator import generate_puzzle
from Sudoku.board import SudokuBoard
from Sudoku.validator import is_valid_number, validate_board
from Sudoku.solver import get_solution

app = Flask(__name__)

@app.route('/api/puzzle/new', methods=['POST'])
def new_puzzle():
    """Generate a new puzzle."""
    difficulty = request.json.get('difficulty', 'medium')
    puzzle = generate_puzzle(difficulty)
    return jsonify({'puzzle': puzzle})

@app.route('/api/puzzle/validate', methods=['POST'])
def validate_move():
    """Validate a player's move."""
    data = request.json
    board = data['board']
    row, col, num = data['row'], data['col'], data['number']
    
    is_valid = is_valid_number(board, row, col, num)
    return jsonify({'valid': is_valid})

@app.route('/api/puzzle/solve', methods=['POST'])
def solve_puzzle():
    """Get solution for a puzzle."""
    puzzle = request.json['puzzle']
    solution = get_solution(puzzle)
    return jsonify({'solution': solution})
```

### For Game Hub Integration

```python
# Example Game Hub Integration
class GameHub:
    """Central hub managing multiple games."""
    
    def __init__(self):
        self.games = {
            'sudoku': self.init_sudoku,
            # Add other games here
        }
    
    def init_sudoku(self):
        """Initialize Sudoku game."""
        from Sudoku.game import SudokuGame
        return SudokuGame()
    
    def play_game(self, game_name):
        """Launch a specific game."""
        if game_name in self.games:
            game = self.games[game_name]()
            game.play()
        else:
            print(f"Game '{game_name}' not found")

# Usage
hub = GameHub()
hub.play_game('sudoku')
```

## Design Principles

### 1. **Separation of Concerns**
- Each module has a single, well-defined responsibility
- Data, logic, and presentation are clearly separated
- Easy to modify one layer without affecting others

### 2. **Modularity**
- Each module can be used independently
- Minimal coupling between modules
- Clear interfaces between components

### 3. **Testability**
- Pure functions for business logic
- No global state
- Easy to unit test each component

### 4. **Extensibility**
- Easy to add new features (difficulty levels, game modes)
- Can integrate with web frameworks
- Pluggable into larger systems

### 5. **Clean Code**
- Comprehensive docstrings
- Clear function names
- Type hints where beneficial
- Comments explaining algorithms

## Security Considerations

For production web deployment:

### 1. **Input Validation**
```python
def validate_coordinates(row, col):
    """Validate user input coordinates."""
    if not isinstance(row, int) or not isinstance(col, int):
        raise ValueError("Coordinates must be integers")
    if not (0 <= row <= 8 and 0 <= col <= 8):
        raise ValueError("Coordinates must be between 0 and 8")
    return True
```

### 2. **Rate Limiting**
- Limit puzzle generation requests
- Prevent solver abuse
- Implement API throttling

### 3. **Data Sanitization**
- Validate all user inputs
- Sanitize board state data
- Check bounds on all operations

### 4. **Error Handling**
```python
try:
    puzzle = generate_puzzle(difficulty)
except Exception as e:
    logger.error(f"Puzzle generation failed: {e}")
    return {"error": "Failed to generate puzzle"}
```

## Performance Considerations

### 1. **Puzzle Generation**
- Hard puzzles skip uniqueness check for speed
- Randomization creates variety
- Average generation time: < 1 second

### 2. **Solving Algorithm**
- Backtracking is efficient for 9x9 grids
- Average solve time: < 100ms
- Worst case: ~1 second

### 3. **Optimization Opportunities**
- Cache generated puzzles
- Pre-generate puzzle pools
- Use numpy for faster array operations (optional)

## Testing Strategy

### Unit Tests
- Test each function independently
- Mock dependencies where needed
- Cover edge cases and error conditions

### Integration Tests
- Test module interactions
- Verify end-to-end puzzle generation and solving
- Test game flow logic

### Test Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical paths (validation, solving)

## Future Architecture Enhancements

### 1. **Database Integration**
```python
# Example with SQLAlchemy
class PuzzleRepository:
    def save_puzzle(self, puzzle, difficulty):
        """Save generated puzzle to database."""
        pass
    
    def get_random_puzzle(self, difficulty):
        """Retrieve a pre-generated puzzle."""
        pass
```

### 2. **Session Management**
```python
class GameSession:
    """Manage user game sessions."""
    def __init__(self, user_id):
        self.user_id = user_id
        self.current_puzzle = None
        self.start_time = None
        self.hints_used = 0
```

### 3. **Leaderboard System**
```python
class LeaderboardService:
    """Track player statistics and rankings."""
    def record_completion(self, user_id, time, difficulty):
        pass
    
    def get_top_players(self, limit=10):
        pass
```

## Deployment Recommendations

### For Development
```bash
python main.py  # Console version
python -m flask run  # Web version (if implemented)
```

### For Production
- Use gunicorn or uvicorn for ASGI
- Implement proper logging
- Set up monitoring and error tracking
- Use environment variables for configuration
- Deploy behind reverse proxy (nginx)

## Conclusion

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Easy testing and maintenance
- ✅ Flexible integration options
- ✅ Scalable design
- ✅ Production-ready foundation

The modular structure makes it ideal for integration into larger game hubs or web applications while maintaining code quality and beginner-friendliness.
