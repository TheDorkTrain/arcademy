import pytest
from would_you_rather_api.question_validator import QuestionEntity

class TestQuestionEntity:
    def test_valid_question(self):
        q = QuestionEntity("Fly", "Be invisible", "Superpowers")
        assert q.is_valid()
        assert q.errors == []

    def test_missing_option1(self):
        q = QuestionEntity("", "Be invisible", "Superpowers")
        assert not q.is_valid()
        assert "Missing or empty required field: option1" in q.errors

    def test_missing_option2(self):
        q = QuestionEntity("Fly", "", "Superpowers")
        assert not q.is_valid()
        assert "Missing or empty required field: option2" in q.errors

    def test_missing_category(self):
        q = QuestionEntity("Fly", "Be invisible", "")
        assert not q.is_valid()
        assert "Missing or empty required field: category" in q.errors

    def test_options_must_be_different(self):
        q = QuestionEntity("Fly", "fly", "Superpowers")
        assert not q.is_valid()
        assert "Option 1 and Option 2 must be different." in q.errors

    def test_to_dict(self):
        q = QuestionEntity("Fly", "Be invisible", "Superpowers", 5, 3)
        d = q.to_dict()
        assert d["option1"] == "Fly"
        assert d["option2"] == "Be invisible"
        assert d["category"] == "Superpowers"
        assert d["option1Votes"] == 5
        assert d["option2Votes"] == 3

    def test_valid_categories_override(self):
        q = QuestionEntity("Fly", "Be invisible", "CustomCat", valid_categories=["CustomCat"])
        assert q.is_valid()
        assert q.errors == []

    def test_votes_default(self):
        q = QuestionEntity("Fly", "Be invisible", "Superpowers")
        assert q.option1Votes == 0
        assert q.option2Votes == 0
