
from typing import Dict, List, Optional
"""
QuestionEntity class for representing and validating "Would You Rather" questions.
"""

class QuestionEntity:
    """
    Attributes:

        REQUIRED_FIELDS (List[str]): List of required fields for a question.
        DEFAULT_CATEGORIES (List[str]): Default categories for questions.
        option1 (str): The first option in the question.
        option2 (str): The second option in the question.
        category (str): The category of the question.
        option1Votes (int): Number of votes for option1 (default: 0).
        option2Votes (int): Number of votes for option2 (default: 0).
        valid_categories (List[str]): List of valid categories (defaults to DEFAULT_CATEGORIES).
        errors (List[str]): List of validation errors.
    Methods:
        __init__(option1: str, option2: str, category: str, option1Votes: int = 0, option2Votes: int = 0, valid_categories: Optional[List[str]] = None):
            Initializes a QuestionEntity instance and validates its fields.
        _validate() -> List[str]:
            Validates the question fields and returns a list of error messages.
        is_valid() -> bool:
            Returns True if the question is valid, False otherwise.
        to_dict() -> Dict:
            Returns a dictionary representation of the question entity.
    """
    
    REQUIRED_FIELDS = ["option1", "option2", "category"]
    DEFAULT_CATEGORIES = [
        "Superpowers", "Entertainment", "Lifestyle", "Time Travel", "Skills",
        "Technology", "Resources", "Food", "Living Arrangements", "Social Skills",
        "Life Control", "Personal Traits", "Basic Needs"
    ]

    def __init__(self, option1: str, option2: str, category: str, option1Votes: int = 0, option2Votes: int = 0, valid_categories: Optional[List[str]] = None):
        self.option1 = option1
        self.option2 = option2
        self.category = category
        self.option1Votes = option1Votes
        self.option2Votes = option2Votes
        self.valid_categories = valid_categories if valid_categories else self.DEFAULT_CATEGORIES
        self.errors = self._validate()

    def _validate(self) -> List[str]:
        """
        Validates the required fields and constraints for a question.

        Returns:
            List[str]: A list of error messages indicating any validation failures.
                - Checks that 'option1', 'option2', and 'category' are present and non-empty.
                - Ensures 'option1' and 'option2' are not identical (case-insensitive).
                - Does not validate the category value itself.
        """
        errors = []
        # Required fields
        if not str(self.option1).strip():
            errors.append("Missing or empty required field: option1")
        if not str(self.option2).strip():
            errors.append("Missing or empty required field: option2")
        if not str(self.category).strip():
            errors.append("Missing or empty required field: category")
        # Options must be different
        if str(self.option1).strip().lower() == str(self.option2).strip().lower():
            errors.append("Option 1 and Option 2 must be different.")
        # Allow any category (no validity check)
        return errors

    def is_valid(self) -> bool:
        """
        Checks if the current object is valid by verifying that there are no errors.

        Returns:
            bool: True if there are no errors, False otherwise.
        """
        return len(self.errors) == 0

    def to_dict(self) -> Dict:
        """
        Converts the question object to a dictionary representation.

        Returns:
            Dict: A dictionary containing the question's options, category, and vote counts.
                - "option1": The first option of the question.
                - "option2": The second option of the question.
                - "category": The category of the question.
                - "option1Votes": The number of votes for option 1.
                - "option2Votes": The number of votes for option 2.
        """
        return {
            "option1": self.option1,
            "option2": self.option2,
            "category": self.category,
            "option1Votes": self.option1Votes,
            "option2Votes": self.option2Votes
        }

# Example usage
if __name__ == "__main__":
    question = QuestionEntity(
        option1="Eat only pizza for a year",
        option2="Eat only burgers for a year",
        category="Food"
    )
    if question.is_valid():
        print("Question is valid!")
        print(question.to_dict())
    else:
        print("Validation errors:")
        for err in question.errors:
            print(f"  - {err}")
