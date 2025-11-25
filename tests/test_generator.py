"""
Tests for Sudoku generator module.
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Sudoku.generator import generate_complete_board, generate_puzzle, get_hint
from Sudoku.validator import validate_board, is_board_solved
from Sudoku.solver import is_solvable


class TestGenerateCompleteBoard:
    """Test the generate_complete_board function."""
    
    def test_generates_valid_board(self):
        """Test that generated board is valid."""
        board = generate_complete_board()
        is_valid, message = validate_board(board)
        assert is_valid is True
    
    def test_generates_complete_board(self):
        """Test that generated board has no empty cells."""
        board = generate_complete_board()
        for row in board:
            assert 0 not in row
    
    def test_generates_solved_board(self):
        """Test that generated board is a valid solution."""
        board = generate_complete_board()
        assert is_board_solved(board) is True


class TestGeneratePuzzle:
    """Test the generate_puzzle function."""
    
    def test_generates_solvable_easy_puzzle(self):
        """Test that easy puzzle is solvable."""
        puzzle = generate_puzzle("easy")
        assert is_solvable(puzzle) is True
    
    def test_generates_solvable_medium_puzzle(self):
        """Test that medium puzzle is solvable."""
        puzzle = generate_puzzle("medium")
        assert is_solvable(puzzle) is True
    
    def test_generates_solvable_hard_puzzle(self):
        """Test that hard puzzle is solvable."""
        puzzle = generate_puzzle("hard")
        assert is_solvable(puzzle) is True
    
    def test_easy_puzzle_has_appropriate_difficulty(self):
        """Test that easy puzzle has appropriate number of filled cells."""
        puzzle = generate_puzzle("easy")
        filled_cells = sum(1 for row in puzzle for cell in row if cell != 0)
        # Easy should have 46-51 filled cells (30-35 removed)
        assert 46 <= filled_cells <= 51
    
    def test_medium_puzzle_has_appropriate_difficulty(self):
        """Test that medium puzzle has appropriate number of filled cells."""
        puzzle = generate_puzzle("medium")
        filled_cells = sum(1 for row in puzzle for cell in row if cell != 0)
        # Medium should have 36-41 filled cells (40-45 removed)
        assert 36 <= filled_cells <= 41
    
    def test_hard_puzzle_has_appropriate_difficulty(self):
        """Test that hard puzzle has appropriate number of filled cells."""
        puzzle = generate_puzzle("hard")
        filled_cells = sum(1 for row in puzzle for cell in row if cell != 0)
        # Hard should have 26-31 filled cells (50-55 removed)
        assert 26 <= filled_cells <= 31
    
    def test_generated_puzzle_is_valid(self):
        """Test that generated puzzle follows Sudoku rules."""
        puzzle = generate_puzzle("medium")
        is_valid, message = validate_board(puzzle)
        assert is_valid is True


class TestGetHint:
    """Test the get_hint function."""
    
    def test_hint_returns_valid_cell(self):
        """Test that hint returns a valid empty cell."""
        puzzle = generate_puzzle("easy")
        solution = [[cell for cell in row] for row in puzzle]
        
        # Find first empty cell and fill it manually for testing
        for i in range(9):
            for j in range(9):
                if puzzle[i][j] == 0:
                    solution[i][j] = 5  # Just for testing
                    break
        
        hint = get_hint(puzzle, solution)
        if hint:
            row, col, value = hint
            assert 0 <= row <= 8
            assert 0 <= col <= 8
            assert 1 <= value <= 9
    
    def test_hint_returns_none_for_complete_board(self):
        """Test that hint returns None for a complete board."""
        board = generate_complete_board()
        hint = get_hint(board, board)
        assert hint is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
