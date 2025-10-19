import React, { useState } from 'react';
import CameraCapture from './CameraCapture';
import { recognizeSign, saveTestResult, generateSpeech } from '../utils/api';

const TestMode = ({ userId }) => {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const generateRandomQuestions = (count = 10) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const selectedLetters = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      selectedLetters.push(alphabet[randomIndex]);
    }
    
    return selectedLetters;
  };

  const startTest = async () => {
    const newQuestions = generateRandomQuestions(10);
    setQuestions(newQuestions);
    setAnswers([]);
    setCurrentQuestion(0);
    setTestStarted(true);
    setTestResult(null);

    // TTS announcement
    try {
      const audioBlob = await generateSpeech('Test started. Show the ASL sign for each letter displayed.');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
    }
  };

  const handleCapture = async (imageData) => {
    setIsProcessing(true);

    try {
      const expectedLetter = questions[currentQuestion];
      const recognition = await recognizeSign(imageData, expectedLetter);
      
      const newAnswers = [...answers, {
        question: expectedLetter,
        recognized: recognition.recognizedLetter,
        correct: recognition.isCorrect
      }];
      setAnswers(newAnswers);

      // TTS feedback
      const feedback = recognition.isCorrect
        ? 'Correct!'
        : `Incorrect. The recognized sign was ${recognition.recognizedLetter}.`;
      
      const audioBlob = await generateSpeech(feedback);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();

      // Move to next question or finish test
      if (currentQuestion < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsProcessing(false);
        }, 2000);
      } else {
        // Test completed
        await finishTest(newAnswers);
      }
    } catch (error) {
      console.error('Error processing sign:', error);
      setIsProcessing(false);
    }
  };

  const finishTest = async (finalAnswers) => {
    const correctCount = finalAnswers.filter(a => a.correct).length;
    const score = correctCount;
    const totalQuestions = finalAnswers.length;

    try {
      const result = await saveTestResult({
        userId: userId || null,
        testType: 'asl-alphabet',
        score,
        totalQuestions,
        resultsData: finalAnswers
      });

      setTestResult({
        testId: result.test_id,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100)
      });

      // TTS announcement
      const audioBlob = await generateSpeech(
        `Test complete! You scored ${score} out of ${totalQuestions}. Your test ID is ${result.test_id}.`
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error saving test result:', error);
    }

    setIsProcessing(false);
    setTestStarted(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Test Mode</h2>

      {!testStarted && !testResult && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>
            Test your ASL knowledge with 10 random letters!
          </p>
          <button
            onClick={startTest}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Start Test
          </button>
        </div>
      )}

      {testStarted && (
        <div>
          <div style={{
            textAlign: 'center',
            margin: '20px 0',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            Question {currentQuestion + 1} of {questions.length}
          </div>

          <div style={{ margin: '20px auto', maxWidth: '800px' }}>
            <CameraCapture
              onCapture={handleCapture}
              expectedLetter={questions[currentQuestion]}
            />
          </div>

          {isProcessing && (
            <div style={{
              textAlign: 'center',
              fontSize: '18px',
              color: '#666',
              marginTop: '20px'
            }}>
              Processing your sign...
            </div>
          )}

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3>Progress:</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '10px'
            }}>
              {questions.map((letter, index) => (
                <div
                  key={index}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 
                      index < currentQuestion 
                        ? (answers[index]?.correct ? '#4CAF50' : '#f44336')
                        : index === currentQuestion
                        ? '#2196F3'
                        : '#e0e0e0',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {index < currentQuestion ? (answers[index]?.correct ? '✓' : '✗') : letter}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {testResult && (
        <div style={{
          margin: '40px auto',
          maxWidth: '600px',
          padding: '30px',
          backgroundColor: '#e8f5e9',
          border: '2px solid #4CAF50',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#2e7d32', marginBottom: '20px' }}>Test Complete!</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4CAF50', margin: '20px 0' }}>
            {testResult.percentage}%
          </div>
          <p style={{ fontSize: '20px', marginBottom: '10px' }}>
            Score: {testResult.score} / {testResult.totalQuestions}
          </p>
          <p style={{ 
            fontSize: '16px',
            color: '#666',
            marginTop: '20px',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '5px'
          }}>
            Test ID: <strong>{testResult.testId}</strong>
          </p>
          <button
            onClick={startTest}
            style={{
              marginTop: '30px',
              padding: '12px 30px',
              fontSize: '16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Take Another Test
          </button>
        </div>
      )}
    </div>
  );
};

export default TestMode;
