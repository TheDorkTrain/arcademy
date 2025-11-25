"""
This module implements a Flask API for managing "Would You Rather" questions.
Endpoints:
    - POST /questions:
        Creates a new question. Expects JSON payload with 'option1', 'option2', and 'category'.
        Validates input using QuestionEntity. Returns created question or validation errors.
    - POST /questions/<int:question_id>/upvote:
        Upvotes a specified option (1 or 2) for a given question.
        Expects 'option' as a query parameter. Returns success message or error.
    - GET /questions/<int:question_id>:
        Retrieves a question by its unique ID. Returns question data or 404 if not found.
    - DELETE /questions/<int:question_id>:
        Deletes a question by its ID. Returns success message or 404 if not found.
    - GET /questions/random:
        Fetches a random question from the database. Returns question data or 404 if none exist.
    - GET /questions/random_by_category:
        Retrieves a random question from a specified category.
        Expects 'category' as a query parameter. Returns question data or 404 if none found.
Dependencies:
    - Flask
    - flask_cors
    - requests
    - random
    - QuestionsDAO (data access object for questions)
    - QuestionEntity (input validation for questions)
"""
from flask import Flask, request, jsonify
import requests
import random
from would_you_rather_api.questions_dao import QuestionsDAO
from would_you_rather_api.question_validator import QuestionEntity
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
dao = QuestionsDAO()

@app.route("/questions", methods=["POST"])
def create_question():
    """
    Creates a new 'Would You Rather' question from the provided JSON payload.

    Expects a JSON object in the request body with the following fields:
        - option1 (str): The first option for the question.
        - option2 (str): The second option for the question.
        - category (str): The category of the question.

    Validates the input data using the QuestionEntity class.
    If validation fails, returns a 400 response with error details.
    On success, creates the question using the DAO and returns the newly created question as JSON.

    Returns:
        Response: JSON representation of the created question or validation errors.
    """
    # token = request.headers.get("token")
    data = request.get_json()
    entity = QuestionEntity(
        option1=data.get("option1"),
        option2=data.get("option2"),
        category=data.get("category")
    )
    if not entity.is_valid():
        return jsonify({"errors": entity.errors}), 400
    new_q = dao.create_question(
        option1=entity.option1,
        option2=entity.option2,
        category=entity.category
    )
    return jsonify(new_q)

@app.route("/questions/<int:question_id>/upvote", methods=["POST"])
def upvote_option(question_id):
    """
    Upvotes a specified option for a given question.

    Args:
        question_id (int): The ID of the question to upvote an option for.

    Query Parameters:
        option (int): The option to upvote (must be 1 or 2).

    Returns:
        Response: A JSON response indicating success or error.
            - 400 if the option is invalid.
            - 404 if the question is not found or the option is invalid.
            - 200 with a success message if upvote is successful.
    """
    # token = request.headers.get("token")
    option = request.args.get("option", type=int)
    if option not in [1, 2]:
        return jsonify({"error": "Invalid option. Must be 1 or 2."}), 400
    success = dao.update_votes(question_id, option)
    if not success:
        return jsonify({"error": "Question not found or invalid option."}), 404
    return jsonify({"message": f"Upvoted option {option} for question {question_id}"})

@app.route("/questions/<int:question_id>", methods=["GET"])
def get_question_by_id(question_id):
    """
    Retrieve a question by its unique ID.

    Args:
        question_id (int): The unique identifier of the question to retrieve.

    Returns:
        Response: A Flask JSON response containing the question data if found,
                  or an error message with a 404 status code if not found.
    """
    # token = request.headers.get("token")
    question = dao.get_question_by_id(question_id)
    if not question:
        return jsonify({"error": "Question not found."}), 404
    return jsonify(question)

@app.route("/questions/<int:question_id>", methods=["DELETE"])
def delete_question(question_id):
    """
    Deletes a question by its ID.

    Args:
        question_id (int): The unique identifier of the question to delete.

    Returns:
        Response: A JSON response indicating success or failure.
            - On success: {"message": "Deleted question <question_id>"}
            - On failure: {"error": "Question not found."}, with HTTP status 404
    """
    # token = request.headers.get("token")
    success = dao.delete_question(question_id)
    if not success:
        return jsonify({"error": "Question not found."}), 404
    return jsonify({"message": f"Deleted question {question_id}"})

@app.route("/questions/random", methods=["GET"])
def get_random_question():
    """
    Fetches a random question from the data access object (DAO).

    Returns:
        Response: A Flask JSON response containing the random question if available,
                  or an error message with a 404 status code if no questions exist.
    """
    # token = request.headers.get("token")
    q = dao.get_random_question()
    if not q:
        return jsonify({"error": "No questions available."}), 404
    return jsonify(q)

@app.route("/questions/random_by_category", methods=["GET"])
def get_random_question_by_category():
    """
    Retrieve a random question from the specified category.

    This endpoint expects a 'category' query parameter in the request.
    It fetches all questions belonging to the given category and returns one at random.
    If no questions are found for the specified category, it returns a 404 error with an appropriate message.

    Returns:
        Response: A JSON object containing a randomly selected question from the category,
                  or an error message if no questions are found.
    """
    # token = request.headers.get("token")
    category = request.args.get("category")
    questions = dao.get_questions_by_category(category)
    if not questions:
        return jsonify({"error": "No questions found for this category."}), 404
    return jsonify(random.choice(questions))

if __name__ == "__main__":
    app.run(debug=True, port=8000)
