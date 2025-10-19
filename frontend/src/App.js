import React, { useState } from 'react';
import LearnMode from './components/LearnMode';
import TestMode from './components/TestMode';
import { createUser } from './utils/api';
import './App.css';

function App() {
  const [mode, setMode] = useState('welcome');
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const newUser = await createUser(userName, userEmail || null);
      setUser(newUser);
      setMode('menu');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const skipUserRegistration = () => {
    setMode('menu');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ASL Teacher</h1>
        <p>Learn American Sign Language</p>
      </header>

      {mode === 'welcome' && (
        <div className="welcome-screen">
          <h2>Welcome to ASL Teacher!</h2>
          <p>Enter your information to get started (optional):</p>
          <form onSubmit={handleUserSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email (optional):</label>
              <input
                type="email"
                id="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={!userName}>
                Continue
              </button>
              <button type="button" onClick={skipUserRegistration} className="btn btn-secondary">
                Skip
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'menu' && (
        <div className="menu-screen">
          <h2>Choose Your Mode</h2>
          {user && <p className="welcome-message">Welcome, {user.name}!</p>}
          <div className="mode-buttons">
            <button onClick={() => setMode('learn')} className="btn btn-learn">
              Learn Mode
              <span className="btn-description">Practice individual letters</span>
            </button>
            <button onClick={() => setMode('test')} className="btn btn-test">
              Test Mode
              <span className="btn-description">Take a 10-question test</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'learn' && (
        <div>
          <button onClick={() => setMode('menu')} className="btn btn-back">
            ← Back to Menu
          </button>
          <LearnMode />
        </div>
      )}

      {mode === 'test' && (
        <div>
          <button onClick={() => setMode('menu')} className="btn btn-back">
            ← Back to Menu
          </button>
          <TestMode userId={user?.id} />
        </div>
      )}
    </div>
  );
}

export default App;
