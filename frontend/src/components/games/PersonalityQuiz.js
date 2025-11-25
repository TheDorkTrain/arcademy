import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalityQuiz.css';

function PersonalityQuiz({ user, token }) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  const questions = [
    {
      id: 1,
      question: "How do you approach a challenging workout or competition?",
      options: [
        { text: "Set a steady pace and maintain it throughout", type: "Endurance" },
        { text: "Push for maximum power and intensity", type: "Strength" },
        { text: "Coordinate with teammates and support each other", type: "TeamPlayer" },
        { text: "Focus on beating my personal best", type: "Competitor" }
      ]
    },
    {
      id: 2,
      question: "What motivates you most in sports or fitness?",
      options: [
        { text: "Long-term goals and consistent progress", type: "Endurance" },
        { text: "Breaking through strength plateaus", type: "Strength" },
        { text: "Team success and camaraderie", type: "TeamPlayer" },
        { text: "Winning and being the best", type: "Competitor" }
      ]
    },
    {
      id: 3,
      question: "How do you handle setbacks or injuries?",
      options: [
        { text: "Take time to recover properly and come back stronger", type: "Mindful" },
        { text: "Analyze what went wrong and adjust my technique", type: "Precision" },
        { text: "Find alternative ways to stay active and push limits", type: "Adrenaline" },
        { text: "Focus on mental preparation and balance", type: "Mindful" }
      ]
    },
    {
      id: 4,
      question: "What's your ideal training environment?",
      options: [
        { text: "Outdoors on long trails or tracks", type: "Endurance" },
        { text: "A well-equipped gym with heavy weights", type: "Strength" },
        { text: "Training with a group or team", type: "TeamPlayer" },
        { text: "Wherever I can push my limits and compete", type: "Competitor" }
      ]
    },
    {
      id: 5,
      question: "How do you prefer to measure your progress?",
      options: [
        { text: "Distance covered and time improvements", type: "Endurance" },
        { text: "Weight lifted and muscle gains", type: "Strength" },
        { text: "Team performance and collaboration quality", type: "TeamPlayer" },
        { text: "Rankings, scores, and competition results", type: "Competitor" }
      ]
    },
    {
      id: 6,
      question: "What describes your competition style?",
      options: [
        { text: "Patient and strategic, playing the long game", type: "Endurance" },
        { text: "Powerful and dominant, showing strength", type: "Strength" },
        { text: "Collaborative and supportive, lifting teammates", type: "TeamPlayer" },
        { text: "Aggressive and driven to win at all costs", type: "Competitor" }
      ]
    },
    {
      id: 7,
      question: "How do you recover after intense training?",
      options: [
        { text: "Active recovery with light movement", type: "Endurance" },
        { text: "Rest and nutrition to rebuild muscle", type: "Strength" },
        { text: "Social activities with training partners", type: "TeamPlayer" },
        { text: "Mental preparation for the next challenge", type: "Competitor" }
      ]
    },
    {
      id: 8,
      question: "What's your approach to training plans?",
      options: [
        { text: "Follow a structured long-term program", type: "Endurance" },
        { text: "Focus on progressive overload and strength cycles", type: "Strength" },
        { text: "Adapt to what the team needs", type: "TeamPlayer" },
        { text: "Whatever gives me the competitive edge", type: "Competitor" }
      ]
    },
    {
      id: 9,
      question: "How important is mental preparation to you?",
      options: [
        { text: "Essential - I practice mindfulness and meditation", type: "Mindful" },
        { text: "Important for perfecting technique and form", type: "Precision" },
        { text: "Less important - I prefer action and excitement", type: "Adrenaline" },
        { text: "Critical for maintaining competitive focus", type: "Competitor" }
      ]
    },
    {
      id: 10,
      question: "What type of physical activities excite you most?",
      options: [
        { text: "Long runs, cycling, or swimming", type: "Endurance" },
        { text: "Weightlifting, powerlifting, or strength training", type: "Strength" },
        { text: "Team sports like basketball, soccer, or volleyball", type: "TeamPlayer" },
        { text: "Extreme sports or high-risk activities", type: "Adrenaline" }
      ]
    },
    {
      id: 11,
      question: "How do you feel about routine and structure?",
      options: [
        { text: "Love it - consistency is key to my success", type: "Endurance" },
        { text: "Need it for progressive training", type: "Strength" },
        { text: "Prefer flexibility to accommodate team needs", type: "TeamPlayer" },
        { text: "Get bored easily - need variety and excitement", type: "Adrenaline" }
      ]
    },
    {
      id: 12,
      question: "What's your relationship with technique and form?",
      options: [
        { text: "Good form prevents injury over long distances", type: "Endurance" },
        { text: "Perfect form is crucial for maximum power", type: "Strength" },
        { text: "Focus on it obsessively - precision matters", type: "Precision" },
        { text: "Less concerned - I trust my instincts", type: "Adrenaline" }
      ]
    },
    {
      id: 13,
      question: "How do you handle stress from competition?",
      options: [
        { text: "Use breathing techniques and stay centered", type: "Mindful" },
        { text: "Channel it into focused performance", type: "Precision" },
        { text: "Thrive on it - stress energizes me", type: "Adrenaline" },
        { text: "Use it as fuel to dominate opponents", type: "Competitor" }
      ]
    },
    {
      id: 14,
      question: "What's your ideal post-workout feeling?",
      options: [
        { text: "Satisfied from a long, steady effort", type: "Endurance" },
        { text: "Muscles pumped and strength proven", type: "Strength" },
        { text: "Connected and energized from group effort", type: "TeamPlayer" },
        { text: "Accomplished and victorious", type: "Competitor" }
      ]
    },
    {
      id: 15,
      question: "How do you define athletic success?",
      options: [
        { text: "Completing long-distance goals and marathons", type: "Endurance" },
        { text: "Hitting new PRs and building strength", type: "Strength" },
        { text: "Team achievements and championships", type: "TeamPlayer" },
        { text: "Being the best and winning consistently", type: "Competitor" }
      ]
    }
  ];

  const personalityTypes = {
    Endurance: {
      name: "🏃‍♂️ The Endurance Runner",
      description: "You excel at long-term challenges and have exceptional mental stamina. Patient and methodical, you thrive on consistency and gradual progress toward ambitious goals.",
      traits: ["Patient", "Consistent", "Goal-oriented", "Mentally Resilient"],
      athletes: ["Eliud Kipchoge", "Kilian Jornet", "Courtney Dauwalter"],
      icon: "🏃‍♂️",
      color: "#4CAF50"
    },
    Strength: {
      name: "🏋️‍♂️ The Strength Trainer",
      description: "You're all about power and progressive growth. Disciplined and focused, you excel when pushing your physical limits and building strength through structured training.",
      traits: ["Disciplined", "Powerful", "Methodical", "Focused"],
      athletes: ["Eddie Hall", "Hafthor Bjornsson", "Jessica Buettner"],
      icon: "🏋️‍♂️",
      color: "#F44336"
    },
    TeamPlayer: {
      name: "⚽ The Team Player",
      description: "You thrive in collaborative environments and find motivation through teamwork. Your strengths shine when supporting others and working toward collective success.",
      traits: ["Collaborative", "Supportive", "Communicative", "Team-oriented"],
      athletes: ["Tom Brady", "Megan Rapinoe", "Stephen Curry"],
      icon: "⚽",
      color: "#2196F3"
    },
    Competitor: {
      name: "🏆 The Competitor",
      description: "You're driven by the pursuit of victory and excel under pressure. Highly motivated and results-focused, you push yourself to be the best in everything you do.",
      traits: ["Competitive", "Driven", "Results-focused", "Determined"],
      athletes: ["Michael Jordan", "Serena Williams", "Cristiano Ronaldo"],
      icon: "🏆",
      color: "#FF9800"
    },
    Mindful: {
      name: "🧘‍♀️ The Mindful Athlete",
      description: "You prioritize balance, self-awareness, and holistic wellness. Your strength lies in mental preparation, stress management, and maintaining harmony between body and mind.",
      traits: ["Balanced", "Self-aware", "Holistic", "Centered"],
      athletes: ["LeBron James", "Novak Djokovic", "Naomi Osaka"],
      icon: "🧘‍♀️",
      color: "#9C27B0"
    },
    Adrenaline: {
      name: "🚀 The Adrenaline Seeker",
      description: "You crave excitement and thrive on high-intensity challenges. Bold and spontaneous, you're energized by pushing limits and taking calculated risks.",
      traits: ["Bold", "Spontaneous", "Thrill-seeking", "Adventurous"],
      athletes: ["Shaun White", "Alex Honnold", "Travis Pastrana"],
      icon: "🚀",
      color: "#E91E63"
    },
    Precision: {
      name: "🎯 The Precision Performer",
      description: "You excel through attention to detail and technical mastery. Consistent and methodical, you believe perfect technique is the foundation of peak performance.",
      traits: ["Detail-oriented", "Technical", "Consistent", "Perfectionist"],
      athletes: ["Simone Biles", "Tiger Woods", "Roger Federer"],
      icon: "🎯",
      color: "#00BCD4"
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  const handleAnswer = (type) => {
    const newAnswers = { ...answers };
    newAnswers[type] = (newAnswers[type] || 0) + 1;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers) => {
    let maxCount = 0;
    let dominantType = '';

    for (let type in finalAnswers) {
      if (finalAnswers[type] > maxCount) {
        maxCount = finalAnswers[type];
        dominantType = type;
      }
    }

    const personalityResult = personalityTypes[dominantType];
    setResult(personalityResult);

    // Calculate score based on consistency (max score 100)
    const score = Math.round((maxCount / questions.length) * 100);

    if (user && token) {
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game_name: 'Athlete Personality Quiz',
            score: score,
            score_metadata: personalityResult.name
          })
        });
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    }
  };

  return (
    <div className="game-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Hub</button>
      
      <div className="game-header">
        <h1>🏃‍♂️ Athlete Personality Quiz</h1>
      </div>

      <div className="game-content">
        {!quizStarted ? (
          <div className="quiz-start">
            <h2>Discover Your Athletic Personality Type</h2>
            <p>Answer 15 questions to find out what type of athlete you are! Whether you're an Endurance Runner, Strength Trainer, Team Player, or one of our other unique athlete types, this quiz will reveal your athletic DNA.</p>
            <button onClick={startQuiz} className="start-btn">Start Quiz</button>
          </div>
        ) : result ? (
          <div className="quiz-result">
            <h2>Your Athletic Personality Type:</h2>
            <div className="result-icon" style={{ fontSize: '4rem' }}>{result.icon}</div>
            <h3 style={{ color: result.color }}>{result.name}</h3>
            <p className="result-description">{result.description}</p>
            <div className="traits">
              <h4>Your Traits:</h4>
              <div className="trait-list">
                {result.traits.map((trait, index) => (
                  <span key={index} className="trait-badge" style={{ backgroundColor: result.color }}>{trait}</span>
                ))}
              </div>
            </div>
            <div className="famous-athletes">
              <h4>You Share Qualities With:</h4>
              <div className="athlete-list">
                {result.athletes.map((athlete, index) => (
                  <div key={index} className="athlete-card" style={{ borderColor: result.color }}>
                    <span className="athlete-icon">🏅</span>
                    <span className="athlete-name">{athlete}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={startQuiz} className="start-btn">Take Quiz Again</button>
          </div>
        ) : (
          <div className="quiz-question">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="question-number">Question {currentQuestion + 1} of {questions.length}</p>
            <h3>{questions[currentQuestion].question}</h3>
            <div className="options">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className="option-btn"
                  onClick={() => handleAnswer(option.type)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonalityQuiz;
