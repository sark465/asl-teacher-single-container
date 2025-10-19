import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createUser = async (name, email) => {
  const response = await api.post('/users', { name, email });
  return response.data;
};

export const getUser = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const saveTestResult = async (testData) => {
  const response = await api.post('/test-results', testData);
  return response.data;
};

export const getTestResult = async (testId) => {
  const response = await api.get(`/test-results/${testId}`);
  return response.data;
};

export const getUserTestResults = async (userId) => {
  const response = await api.get(`/test-results/user/${userId}`);
  return response.data;
};

export const recognizeSign = async (imageData, expectedLetter) => {
  const response = await api.post('/recognize-sign', {
    image: imageData,
    expectedLetter,
  });
  return response.data;
};

export const generateSpeech = async (text) => {
  const response = await api.post('/tts', { text }, {
    responseType: 'blob',
  });
  return response.data;
};
