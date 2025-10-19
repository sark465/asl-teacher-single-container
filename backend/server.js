require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { pool, initDB } = require('./db');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit expensive operations to 20 per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate unique test ID with ASL prefix
function generateTestId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ASL${timestamp}${random}`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ASL Teacher API' });
});

// User endpoints
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Test result endpoints
app.post('/api/test-results', async (req, res) => {
  try {
    const { userId, testType, score, totalQuestions, resultsData } = req.body;
    const testId = generateTestId();

    const result = await pool.query(
      `INSERT INTO test_results 
       (test_id, user_id, test_type, score, total_questions, results_data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [testId, userId, testType, score, totalQuestions, JSON.stringify(resultsData)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving test result:', error);
    res.status(500).json({ error: 'Failed to save test result' });
  }
});

app.get('/api/test-results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await pool.query(
      'SELECT * FROM test_results WHERE test_id = $1',
      [testId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching test result:', error);
    res.status(500).json({ error: 'Failed to fetch test result' });
  }
});

app.get('/api/test-results/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM test_results WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// ASL Recognition endpoint using OpenAI (rate limited)
app.post('/api/recognize-sign', strictLimiter, async (req, res) => {
  try {
    const { image, expectedLetter } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Use OpenAI Vision API to recognize the ASL sign
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and identify if it shows an ASL (American Sign Language) hand sign. If it does, identify which letter (A-Z) the hand sign represents. Respond with ONLY the single letter in uppercase, or "UNKNOWN" if you cannot identify a clear ASL sign.${expectedLetter ? ` The expected letter is ${expectedLetter}.` : ''}`
            },
            {
              type: 'image_url',
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 10
    });

    const recognizedLetter = response.choices[0].message.content.trim().toUpperCase();
    const isCorrect = expectedLetter ? recognizedLetter === expectedLetter.toUpperCase() : null;

    res.json({
      recognizedLetter,
      isCorrect,
      confidence: recognizedLetter !== 'UNKNOWN' ? 'high' : 'low'
    });
  } catch (error) {
    console.error('Error recognizing sign:', error);
    res.status(500).json({ error: 'Failed to recognize sign' });
  }
});

// TTS endpoint (rate limited)
app.post('/api/tts', strictLimiter, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`ASL Teacher API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
