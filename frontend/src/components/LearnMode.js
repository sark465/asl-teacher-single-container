import React, { useState } from 'react';
import CameraCapture from './CameraCapture';
import { recognizeSign, generateSpeech } from '../utils/api';

const LearnMode = () => {
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleCapture = async (imageData) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const recognition = await recognizeSign(imageData, selectedLetter);
      setResult(recognition);

      // Generate TTS feedback
      const feedback = recognition.isCorrect
        ? `Excellent! You correctly signed the letter ${selectedLetter}.`
        : `The recognized sign is ${recognition.recognizedLetter}. Please try again for ${selectedLetter}.`;

      const audioBlob = await generateSpeech(feedback);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error processing sign:', error);
      setResult({ error: 'Failed to process sign. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Learn Mode</h2>
      
      <div style={{ 
        margin: '20px auto',
        maxWidth: '800px',
        textAlign: 'center'
      }}>
        <label style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginRight: '10px'
        }}>
          Select a letter to practice:
        </label>
        <select
          value={selectedLetter}
          onChange={(e) => setSelectedLetter(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        >
          {alphabet.map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>
      </div>

      <div style={{ margin: '20px auto', maxWidth: '800px' }}>
        <CameraCapture 
          onCapture={handleCapture}
          expectedLetter={selectedLetter}
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

      {result && !result.error && (
        <div style={{
          margin: '20px auto',
          maxWidth: '600px',
          padding: '20px',
          backgroundColor: result.isCorrect ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.isCorrect ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: result.isCorrect ? '#155724' : '#721c24',
            margin: '0 0 10px 0'
          }}>
            {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </h3>
          <p style={{ 
            fontSize: '16px',
            margin: '5px 0',
            color: '#333'
          }}>
            Recognized: <strong>{result.recognizedLetter}</strong>
          </p>
          <p style={{ 
            fontSize: '14px',
            margin: '5px 0',
            color: '#666'
          }}>
            Expected: <strong>{selectedLetter}</strong>
          </p>
        </div>
      )}

      {result && result.error && (
        <div style={{
          margin: '20px auto',
          maxWidth: '600px',
          padding: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#721c24'
        }}>
          {result.error}
        </div>
      )}
    </div>
  );
};

export default LearnMode;
