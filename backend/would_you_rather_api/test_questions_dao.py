
import pytest
from unittest.mock import patch, mock_open
from would_you_rather_api.questions_dao import QuestionsDAO


import os

MOCK_JSON = "mock_questions.json"

def setup_mock_json():
    with open(MOCK_JSON, "w", encoding="utf-8") as f:
        f.write('{"questions": []}')

def teardown_mock_json():
    if os.path.exists(MOCK_JSON):
        os.remove(MOCK_JSON)

class TestQuestionsDAO:
    def setup_method(self):
        setup_mock_json()
        self.dao = QuestionsDAO(MOCK_JSON)

    def teardown_method(self):
        teardown_mock_json()

    def test_create_and_get_question(self):
        q = self.dao.create_question("A", "B", "Cat")
        assert q["option1"] == "A"
        assert q["option2"] == "B"
        assert q["category"] == "Cat"
        assert q["option1Votes"] == 0
        assert q["option2Votes"] == 0
        got = self.dao.get_question_by_id(q["id"])
        assert got == q

    def test_get_random_question(self):
        self.dao.create_question("A", "B", "Cat")
        self.dao.create_question("C", "D", "Cat")
        q = self.dao.get_random_question()
        assert q["option1"] in ["A", "C"]

    def test_delete_question(self):
        q = self.dao.create_question("A", "B", "Cat")
        assert self.dao.delete_question(q["id"])
        assert self.dao.get_question_by_id(q["id"]) is None
        assert not self.dao.delete_question(99)

    def test_get_questions_by_category(self):
        self.dao.create_question("A", "B", "Cat1")
        self.dao.create_question("C", "D", "Cat2")
        cat1 = self.dao.get_questions_by_category("Cat1")
        assert len(cat1) == 1
        assert cat1[0]["option1"] == "A"

    def test_get_all_questions(self):
        self.dao.create_question("A", "B", "Cat")
        all_q = self.dao.get_all_questions()
        assert len(all_q) == 1
        assert all_q[0]["option1"] == "A"

    def test_update_votes(self):
        q = self.dao.create_question("A", "B", "Cat")
        assert self.dao.update_votes(q["id"], 1)
        assert self.dao.get_question_by_id(q["id"])['option1Votes'] == 1
        assert self.dao.update_votes(q["id"], 2)
        assert self.dao.get_question_by_id(q["id"])['option2Votes'] == 1
        assert not self.dao.update_votes(q["id"], 3)
        assert not self.dao.update_votes(99, 1)

    def test_get_all_categories(self):
        self.dao.create_question("A", "B", "Cat1")
        self.dao.create_question("C", "D", "Cat2")
        cats = self.dao.get_all_categories()
        assert set(cats) == {"Cat1", "Cat2"}

        def test_empty_behaviors(self):
            # New DAO, no questions
            assert self.dao.get_random_question() is None
            assert self.dao.get_all_questions() == []
            assert self.dao.get_all_categories() == []

        def test_id_assignment(self):
            q1 = self.dao.create_question("A", "B", "Cat")
            q2 = self.dao.create_question("C", "D", "Cat")
            assert q2["id"] == q1["id"] + 1

        def test_case_insensitive_category(self):
            self.dao.create_question("A", "B", "Cat1")
            results = self.dao.get_questions_by_category("cat1")
            assert len(results) == 1
            assert results[0]["option1"] == "A"

        def test_get_next_id(self):
            # Directly test _get_next_id
            assert self.dao._get_next_id() == 1
            self.dao.create_question("A", "B", "Cat")
            assert self.dao._get_next_id() == 2

