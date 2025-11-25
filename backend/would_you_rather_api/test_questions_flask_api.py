import pytest
from would_you_rather_api.questions_flask_api import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_create_question(client):
    response = client.post('/questions', json={
        'option1': 'Option A',
        'option2': 'Option B',
        'category': 'TestCat'
    })
    assert response.status_code == 200 or response.status_code == 201
    data = response.get_json()
    assert 'option1' in data and 'option2' in data

def test_get_random_question(client):
    response = client.get('/questions/random')
    assert response.status_code in [200, 404]

def test_upvote_option(client):
    # First, create a question
    create_resp = client.post('/questions', json={
        'option1': 'A', 'option2': 'B', 'category': 'TestCat'
    })
    q = create_resp.get_json()
    qid = q.get('id')
    # Upvote option 1
    upvote_resp = client.post(f'/questions/{qid}/upvote?option=1')
    assert upvote_resp.status_code == 200
    upvote_data = upvote_resp.get_json()
    assert 'Upvoted option' in upvote_data.get('message', '')

def test_get_question_by_id(client):
    create_resp = client.post('/questions', json={
        'option1': 'A', 'option2': 'B', 'category': 'TestCat'
    })
    q = create_resp.get_json()
    qid = q.get('id')
    get_resp = client.get(f'/questions/{qid}')
    assert get_resp.status_code == 200
    data = get_resp.get_json()
    assert data['option1'] == 'A'
    assert data['option2'] == 'B'

def test_delete_question(client):
    create_resp = client.post('/questions', json={
        'option1': 'A', 'option2': 'B', 'category': 'TestCat'
    })
    q = create_resp.get_json()
    qid = q.get('id')
    del_resp = client.delete(f'/questions/{qid}')
    assert del_resp.status_code == 200
    msg = del_resp.get_json().get('message', '')
    assert 'Deleted question' in msg

def test_random_by_category(client):
    # Create a question with a specific category
    client.post('/questions', json={
        'option1': 'A', 'option2': 'B', 'category': 'SpecialCat'
    })
    resp = client.get('/questions/random_by_category?category=SpecialCat')
    assert resp.status_code in [200, 404]
