"""
Tests for Sudoku validator module.
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Sudoku.validator import (
    is_valid_number,
    validate_board,
    is_board_solved,
    find_empty_cell
)


class TestIsValidNumber:
    """Test the is_valid_number function."""
    
    def test_valid_placement(self):
        """Test valid number placement."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        assert is_valid_number(board, 0, 0, 5) is True
    
    def test_invalid_row_duplicate(self):
        """Test invalid placement - duplicate in row."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 5
        assert is_valid_number(board, 0, 5, 5) is False
    
    def test_invalid_column_duplicate(self):
        """Test invalid placement - duplicate in column."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 5
        assert is_valid_number(board, 5, 0, 5) is False
    
    def test_invalid_box_duplicate(self):
        """Test invalid placement - duplicate in 3x3 box."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 5
        assert is_valid_number(board, 2, 2, 5) is False
    
    def test_invalid_number_range(self):
        """Test invalid number (out of range)."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        assert is_valid_number(board, 0, 0, 0) is False
        assert is_valid_number(board, 0, 0, 10) is False


class TestValidateBoard:
    """Test the validate_board function."""
    
    def test_empty_board_is_valid(self):
        """Test that an empty board is valid."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        is_valid, message = validate_board(board)
        assert is_valid is True
    
    def test_partial_valid_board(self):
        """Test a partially filled valid board."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 1
        board[0][1] = 2
        board[1][0] = 3
        is_valid, message = validate_board(board)
        assert is_valid is True
    
    def test_invalid_board_row_duplicate(self):
        """Test invalid board with row duplicate."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 5
        board[0][5] = 5
        is_valid, message = validate_board(board)
        assert is_valid is False
        assert "Row 1" in message
    
    def test_invalid_board_column_duplicate(self):
        """Test invalid board with column duplicate."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 5
        board[5][0] = 5
        is_valid, message = validate_board(board)
        assert is_valid is False
        assert "Column 1" in message


class TestIsBoardSolved:
    """Test the is_board_solved function."""
    
    def test_incomplete_board_not_solved(self):
        """Test that incomplete board is not solved."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        assert is_board_solved(board) is False
    
    def test_complete_valid_board_is_solved(self):
        """Test that a complete valid board is solved."""
        # Create a valid complete board
        board = [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ]
        assert is_board_solved(board) is True


class TestFindEmptyCell:
    """Test the find_empty_cell function."""
    
    def test_find_empty_in_empty_board(self):
        """Test finding empty cell in empty board."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        result = find_empty_cell(board)
        assert result == (0, 0)
    
    def test_find_empty_in_partial_board(self):
        """Test finding empty cell in partially filled board."""
        board = [[0 for _ in range(9)] for _ in range(9)]
        board[0][0] = 5
        result = find_empty_cell(board)
        assert result == (0, 1)
    
    def test_no_empty_in_complete_board(self):
        """Test no empty cell in complete board."""
        board = [[1 for _ in range(9)] for _ in range(9)]
        result = find_empty_cell(board)
        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
