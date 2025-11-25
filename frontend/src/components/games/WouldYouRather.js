import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './WouldYouRather.css';

const API_URL = 'http://127.0.0.1:8000';
const TOKEN = 'carol-secret-token'; // Replace with your actual token logic

function WouldYouRather() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ option1: '', option2: '', category: '' });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    fetchQuestion();
  }, []);


  const fetchQuestion = async () => {
    setLoading(true);
    setError('');
    setVoted(false);
    try {
      const res = await axios.get(`${API_URL}/questions/random`, {
        headers: { token: TOKEN }
      });
      setQuestion(res.data);
    } catch (err) {
      setError('Could not fetch question.');
    }
    setLoading(false);
  };

  const handleVote = async (option) => {
    if (!question) return;
    try {
      await axios.post(
        `${API_URL}/questions/${question.id}/upvote?option=${option}`,
        {},
        { headers: { token: TOKEN } }
      );
      // Fetch updated question to get new vote counts
      const res = await axios.get(`${API_URL}/questions/${question.id}`, {
        headers: { token: TOKEN }
      });
      setQuestion(res.data);
      setVoted(true);
    } catch (err) {
      setError('Could not register vote.');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!newQuestion.option1 || !newQuestion.option2 || !newQuestion.category) {
      setAddError('All fields are required.');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/questions`,
        newQuestion,
        { headers: { token: TOKEN } }
      );
      setAddSuccess('Question added successfully!');
  setNewQuestion({ option1: '', option2: '', category: '' });
    } catch (err) {
      setAddError('Could not add question.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!question) return <div>No question found.</div>;


  return (
    <div className="game-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Hub</button>
      <div className="game-header">
        <h1>🤔 Would You Rather</h1>
      </div>
      <div className="game-content">
        <div className="wyr-question">
          <h2>Would You Rather...</h2>
          <div className="choices">
            <button 
              className="choice-btn choice-a"
              onClick={() => handleVote(1)}
              disabled={voted}
            >
              <span className="choice-label">A</span>
              <span className="choice-text">{question.option1}</span>
            </button>
            <div className="or-divider">OR</div>
            <button 
              className="choice-btn choice-b"
              onClick={() => handleVote(2)}
              disabled={voted}
            >
              <span className="choice-label">B</span>
              <span className="choice-text">{question.option2}</span>
            </button>
          </div>
          <div>Category: <b>{question.category}</b></div>
          {voted && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ color: 'green', marginBottom: '20px' }}>Thanks for voting!</div>
              <div style={{ marginBottom: '10px' }}>
                <b>A:</b> {question.option1Votes} votes
              </div>
              <div style={{ marginBottom: '10px' }}>
                <b>B:</b> {question.option2Votes} votes
              </div>
            </div>
          )}
          <button onClick={fetchQuestion} style={{ marginTop: '30px', padding: '8px 16px' }}>Next Question</button>
        </div>
        <hr style={{ margin: '40px 0' }} />
        <button onClick={() => setShowAdd(!showAdd)} style={{ marginBottom: '20px', padding: '8px 16px' }}>
          {showAdd ? 'Hide Add Question' : 'Add a New Question'}
        </button>
        {showAdd && (
          <form onSubmit={handleAddQuestion} style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>Option 1:</label>
              <input
                type="text"
                value={newQuestion.option1}
                onChange={e => setNewQuestion({ ...newQuestion, option1: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Option 2:</label>
              <input
                type="text"
                value={newQuestion.option2}
                onChange={e => setNewQuestion({ ...newQuestion, option2: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Category:</label>
              <input
                type="text"
                value={newQuestion.category}
                onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" style={{ padding: '8px 16px' }}>Submit</button>
            {addError && <div style={{ color: 'red', marginTop: '10px' }}>{addError}</div>}
            {addSuccess && <div style={{ color: 'green', marginTop: '10px' }}>{addSuccess}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default WouldYouRather;
