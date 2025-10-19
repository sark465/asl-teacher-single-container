# ASL Teacher - Single Container Application

A full-stack web application for learning American Sign Language (ASL) that runs entirely in a single Docker container. The app uses computer vision to recognize ASL hand signs, provides interactive learning and testing modes, and stores user progress with unique test IDs.

## Features

- 🎥 **Real-time Camera Integration**: Uses MediaPipe for hand detection and tracking
- 🤖 **AI-Powered Recognition**: OpenAI Vision API for ASL sign recognition
- 📚 **Learn Mode**: Practice individual letters with instant feedback
- 📝 **Test Mode**: Take randomized 10-question tests
- 🔊 **Text-to-Speech Feedback**: Audio feedback for learning and testing
- 💾 **Progress Tracking**: Stores test results with unique ASL-prefixed test IDs
- 👤 **User Management**: Optional user registration and test history
- 🐳 **Single Container**: All services (React, Node/Express, PostgreSQL, Nginx) in one container

## Architecture

The application consists of:

- **Frontend**: React app with MediaPipe for hand tracking
- **Backend**: Node.js/Express API with OpenAI integration
- **Database**: PostgreSQL for storing users and test results
- **Web Server**: Nginx serving the frontend and proxying API requests
- **Process Manager**: Supervisord managing all services in a single container

## Prerequisites

- Docker and Docker Compose
- OpenAI API key (for sign recognition and TTS)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/sark465/asl-teacher-single-container.git
   cd asl-teacher-single-container
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   
   Open your browser and navigate to: `http://localhost:8080`

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Backend API port (default: 3001)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_NAME`: Database name (default: asl_teacher)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)

## Usage

### Learn Mode

1. Select a letter from the dropdown menu
2. Position your hand in front of the camera
3. Make the ASL sign for the selected letter
4. Click "Capture Sign" when your hand is detected
5. Receive instant feedback with TTS audio

### Test Mode

1. Click "Start Test" to begin a 10-question test
2. Show the ASL sign for each displayed letter
3. Capture each sign when prompted
4. Receive your score and a unique test ID (e.g., ASL1A2B3C4D)
5. View your progress throughout the test

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Test Results Table
```sql
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  test_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  test_type VARCHAR(50),
  score INTEGER,
  total_questions INTEGER,
  results_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### User Management
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID

### Test Results
- `POST /api/test-results` - Save test results
- `GET /api/test-results/:testId` - Get test result by test ID
- `GET /api/test-results/user/:userId` - Get all test results for a user

### ASL Recognition
- `POST /api/recognize-sign` - Recognize ASL sign from image
- `POST /api/tts` - Generate text-to-speech audio

### Health Check
- `GET /api/health` - Check API status

## Development

### Running Locally (without Docker)

#### Backend
```bash
cd backend
npm install
# Set up PostgreSQL and create .env file
npm start
```

#### Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:3001/api npm start
```

### Building for Production

```bash
# Build Docker image
docker build -t asl-teacher .

# Run container
docker run -p 8080:80 -e OPENAI_API_KEY=your_key_here asl-teacher
```

## Technology Stack

- **Frontend**: React, MediaPipe, Axios
- **Backend**: Node.js, Express, OpenAI API, pg
- **Database**: PostgreSQL
- **Web Server**: Nginx
- **Containerization**: Docker, Supervisord
- **AI/ML**: OpenAI GPT-4 Vision, OpenAI TTS

## Unique Features

- **ASL-Prefixed Test IDs**: Every test generates a unique ID starting with "ASL" (e.g., ASL1A2B3C4D)
- **Multi-Process Single Container**: Uses supervisord to run PostgreSQL, Node.js, and Nginx in one container
- **Real-time Hand Tracking**: MediaPipe provides visual feedback with hand landmarks
- **AI-Powered Recognition**: Uses GPT-4 Vision for accurate ASL sign recognition
- **Audio Feedback**: Text-to-speech provides auditory learning support

## Troubleshooting

### Camera Access Issues
- Ensure your browser has permission to access the camera
- Use HTTPS or localhost (required for camera access)

### API Key Issues
- Verify your OpenAI API key is correctly set in the .env file
- Check that you have sufficient API credits

### Container Issues
- Check logs: `docker-compose logs -f`
- Restart services: `docker-compose restart`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.