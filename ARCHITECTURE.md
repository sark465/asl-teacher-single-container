# ASL Teacher - Architecture Documentation

## Overview

ASL Teacher is a full-stack web application that runs entirely in a single Docker container. It combines multiple technologies to provide an interactive ASL learning experience.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Container                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Nginx   │  │ Node.js  │  │PostgreSQL│             │
│  │  :80     │  │  :3001   │  │  :5432   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│       ▲              ▲              ▲                   │
│       │              │              │                   │
│       └──────────────┴──────────────┘                   │
│              Supervisord                                │
└─────────────────────────────────────────────────────────┘
                      ▲
                      │
              User's Browser
         (Camera + MediaPipe)
```

## Components

### 1. Frontend (React)

**Location:** `/app/frontend`

**Technology Stack:**
- React 18
- MediaPipe Hands
- Axios for API calls

**Key Components:**

- **App.js**: Main application component, handles routing between welcome, menu, learn, and test modes
- **CameraCapture.js**: Integrates camera and MediaPipe for hand detection
- **LearnMode.js**: Practice mode for individual letters
- **TestMode.js**: Testing mode with 10 random questions

**Flow:**
1. User grants camera permission
2. MediaPipe processes video stream for hand detection
3. User positions hand and captures image
4. Image sent to backend for recognition
5. Results displayed with TTS feedback

### 2. Backend (Node.js/Express)

**Location:** `/app/backend`

**Technology Stack:**
- Node.js 18
- Express.js
- PostgreSQL client (pg)
- OpenAI API

**Key Modules:**

- **server.js**: Main Express server
  - API endpoint definitions
  - OpenAI integration
  - Request handling
  
- **db.js**: Database management
  - Connection pool
  - Schema initialization
  - Query helpers

**API Endpoints:**

```
GET  /api/health                      - Health check
POST /api/users                       - Create user
GET  /api/users/:id                   - Get user
POST /api/test-results                - Save test result
GET  /api/test-results/:testId        - Get test result
GET  /api/test-results/user/:userId   - Get user's test results
POST /api/recognize-sign              - Recognize ASL sign
POST /api/tts                         - Text-to-speech
```

### 3. Database (PostgreSQL)

**Location:** `/var/lib/postgresql/data`

**Schema:**

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test results table
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

### 4. Web Server (Nginx)

**Configuration:** `/etc/nginx/sites-available/default`

**Responsibilities:**
- Serve static React build files
- Proxy API requests to backend
- Handle CORS headers
- Optimize static file serving

**Routes:**
- `/` → React app (SPA)
- `/api/*` → Backend proxy

### 5. Process Manager (Supervisord)

**Configuration:** `/etc/supervisor/conf.d/supervisord.conf`

**Managed Processes:**
1. **PostgreSQL** (Priority 1)
   - Started first
   - Initialized via init-postgres.sh
   
2. **Backend** (Priority 2)
   - Waits for PostgreSQL
   - Initializes database schema
   
3. **Nginx** (Priority 3)
   - Serves frontend
   - Proxies API requests

## Data Flow

### Learn Mode Flow

```
User Browser
    │
    ├─► Camera Access
    │   └─► MediaPipe Hand Detection
    │       └─► Hand Landmarks Overlay
    │
    ├─► Capture Image (JPEG)
    │
    ├─► POST /api/recognize-sign
    │   ├─► OpenAI Vision API
    │   └─► Recognition Result
    │
    ├─► POST /api/tts
    │   ├─► OpenAI TTS API
    │   └─► Audio Feedback
    │
    └─► Display Result
```

### Test Mode Flow

```
User Browser
    │
    ├─► Start Test
    │   └─► Generate 10 Random Letters
    │
    ├─► For Each Question:
    │   ├─► Display Letter
    │   ├─► Capture Sign
    │   ├─► POST /api/recognize-sign
    │   ├─► Record Answer
    │   └─► TTS Feedback
    │
    ├─► Calculate Score
    │
    ├─► POST /api/test-results
    │   ├─► Generate Test ID (ASL prefix)
    │   └─► Store in PostgreSQL
    │
    └─► Display Results
```

## Security Considerations

1. **API Key Protection**
   - OpenAI API key stored in environment variable
   - Never exposed to client
   - Validated on backend

2. **Input Validation**
   - All API inputs validated
   - SQL injection prevention via parameterized queries
   - Image size limits enforced

3. **CORS Configuration**
   - Configured for same-origin by default
   - Can be customized for production

## Performance Optimizations

1. **Frontend**
   - React production build
   - Nginx gzip compression
   - Static asset caching

2. **Backend**
   - Connection pooling for PostgreSQL
   - Async/await for non-blocking operations
   - Response size limits

3. **Database**
   - Indexed columns (id, test_id, user_id)
   - JSONB for flexible result storage
   - Query optimization

## Scalability Considerations

### Current Setup (Single Container)
- Suitable for: Development, demos, small deployments
- Limitations: Single point of failure, limited concurrent users

### Potential Improvements for Production:
1. Separate containers for each service
2. Load balancing with multiple backend instances
3. External PostgreSQL service
4. Redis for session management
5. CDN for static assets
6. WebSocket for real-time updates

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key (required) |
| `PORT` | 3001 | Backend API port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | asl_teacher | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `NODE_ENV` | production | Node environment |

## Deployment

### Single Container Deployment
```bash
docker build -t asl-teacher .
docker run -p 8080:80 -e OPENAI_API_KEY=sk-... asl-teacher
```

### Docker Compose Deployment
```bash
docker compose up -d
```

## Monitoring and Debugging

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker exec -it <container_id> tail -f /var/log/backend.out.log
docker exec -it <container_id> tail -f /var/log/postgres.out.log
docker exec -it <container_id> tail -f /var/log/nginx/access.log
```

### Database Access
```bash
docker exec -it <container_id> su - postgres -c "psql asl_teacher"
```

### Service Status
```bash
docker exec -it <container_id> supervisorctl status
```

## Future Enhancements

1. **Features**
   - Sentence recognition
   - Progress tracking dashboard
   - Multiplayer competitions
   - Mobile app

2. **Technical**
   - WebSocket for real-time feedback
   - Offline mode with service workers
   - Advanced analytics
   - Multi-language support

3. **Infrastructure**
   - Kubernetes deployment
   - Horizontal scaling
   - High availability setup
   - Automated backups
