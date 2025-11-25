from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv 
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///gamehub.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

CORS(app)
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))


# Handle JWT errors
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({'error': 'Missing or invalid authorization header'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    return jsonify({'error': 'Invalid token', 'message': str(callback)}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    scores = db.relationship('Score', backref='user', lazy=True)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    score_metadata = db.Column(db.String(500))  # JSON string for additional data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Create tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(username=username, password_hash=password_hash)
    
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        'message': 'User created successfully',
        'access_token': access_token,
        'user': {
            'id': new_user.id,
            'username': new_user.username,
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200

@app.route('/api/scores', methods=['GET'])
@jwt_required()
def get_scores():
    user_id = get_jwt_identity()
    scores = Score.query.filter_by(user_id=user_id).order_by(Score.created_at.desc()).all()
    
    # Group scores by game and get best score for each
    game_scores = {}
    for score in scores:
        if score.game_name not in game_scores or score.score > game_scores[score.game_name]['score']:
            game_scores[score.game_name] = {
                'game_name': score.game_name,
                'score': score.score,
                'score_metadata': score.score_metadata,
                'created_at': score.created_at.isoformat()
            }
    
    return jsonify(list(game_scores.values())), 200

@app.route('/api/scores', methods=['POST'])
@jwt_required()
def add_score():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    
    game_name = data.get('game_name')
    score = data.get('score')
    score_metadata = data.get('score_metadata', '')

    if not game_name or score is None:
        return jsonify({'error': 'Missing required fields'}), 400

    new_score = Score(user_id=user_id, game_name=game_name, score=score, score_metadata=score_metadata)
    db.session.add(new_score)
    db.session.commit()

    return jsonify({
        'message': 'Score added successfully',
        'score': {
            'id': new_score.id,
            'game_name': new_score.game_name,
            'score': new_score.score,
            'score_metadata': new_score.score_metadata,
            'created_at': new_score.created_at.isoformat()
        }
    }), 201

@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200

@app.route('/api/zork', methods=['POST'])
def play_zork():
    try:
        user_input = request.json.get('input', '')
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are playing the game Zork. Respond only with game actions and descriptions."},
                {"role": "user", "content": user_input}
            ]
        )
        
        return jsonify({
            'response': response.choices[0].message.content
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
