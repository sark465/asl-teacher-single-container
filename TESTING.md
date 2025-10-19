# Testing Guide

This guide helps you test the ASL Teacher application thoroughly.

## Prerequisites

1. Docker and Docker Compose installed
2. OpenAI API key configured in `.env` file
3. Camera/webcam available

## Quick Test

Run the setup verification script:
```bash
./setup-check.sh
```

This will verify:
- Docker installation
- Docker Compose installation
- File structure
- Environment configuration
- OpenAI API key format

## Building the Application

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

Wait for all services to start (approximately 1-2 minutes).

## Manual Testing Checklist

### 1. Health Check

```bash
# Check API health
curl http://localhost:8080/api/health

# Expected response:
# {"status":"ok","service":"ASL Teacher API"}
```

### 2. Frontend Access

1. Open browser: `http://localhost:8080`
2. Verify the welcome screen loads
3. Check that the ASL Teacher header is visible

### 3. User Registration (Optional Flow)

1. Enter a test name (e.g., "Test User")
2. Optionally enter an email
3. Click "Continue" or "Skip"
4. Verify navigation to menu screen

### 4. Learn Mode Testing

1. Click "Learn Mode" from menu
2. **Camera Permissions**:
   - Grant camera permission when prompted
   - Verify camera feed appears
   - Check that MediaPipe hand detection is working (green skeleton overlay)
3. **Letter Selection**:
   - Select different letters from dropdown
   - Verify letter is displayed in the camera view
4. **Sign Recognition**:
   - Make an ASL hand sign in front of camera
   - Wait for "Hand Detected" indicator
   - Click "Capture Sign"
   - Verify processing message appears
   - Check recognition result (correct/incorrect)
   - Listen for audio feedback
5. **Multiple Letters**:
   - Test at least 3 different letters
   - Verify each works independently

### 5. Test Mode Testing

1. Return to menu (click "← Back to Menu")
2. Click "Test Mode"
3. **Test Start**:
   - Click "Start Test"
   - Listen for audio announcement
   - Verify 10 questions are generated
4. **Test Progression**:
   - For each of the 10 questions:
     - Make the sign for displayed letter
     - Capture the sign
     - Listen for feedback
     - Observe progress indicator update
5. **Test Completion**:
   - Verify final score is displayed
   - Check that percentage is calculated correctly
   - Verify test ID is shown (starts with "ASL")
   - Note the test ID for later verification
6. **Retake Test**:
   - Click "Take Another Test"
   - Verify new test starts with different questions

### 6. API Testing

#### Create User
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test User","email":"test@example.com"}'
```

Expected: User object with ID

#### Get User
```bash
curl http://localhost:8080/api/users/1
```

Expected: User details

#### Save Test Result
```bash
curl -X POST http://localhost:8080/api/test-results \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "testType": "asl-alphabet",
    "score": 8,
    "totalQuestions": 10,
    "resultsData": [{"question":"A","recognized":"A","correct":true}]
  }'
```

Expected: Test result with unique test ID (ASL prefix)

#### Get Test Results
```bash
curl http://localhost:8080/api/test-results/user/1
```

Expected: Array of test results

### 7. Rate Limiting Testing

Test general rate limit:
```bash
for i in {1..110}; do
  curl -s http://localhost:8080/api/health > /dev/null
  echo "Request $i"
done
```

Expected: After 100 requests within 15 minutes, receive 429 error

### 8. Database Testing

Access database:
```bash
# Get container ID
docker ps

# Access PostgreSQL
docker exec -it <container_id> su - postgres -c "psql asl_teacher"
```

Run queries:
```sql
-- Check users table
SELECT * FROM users;

-- Check test_results table
SELECT test_id, score, total_questions, created_at FROM test_results;

-- Verify test ID format
SELECT test_id FROM test_results WHERE test_id LIKE 'ASL%';

-- Exit
\q
```

### 9. Logs Verification

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs -f  # Follow mode

# Check for errors
docker compose logs | grep -i error
```

### 10. Service Health

```bash
# Get container ID
docker ps

# Check supervisord status
docker exec -it <container_id> supervisorctl status

# Expected output:
# nginx                            RUNNING
# postgres                         RUNNING
# backend                          RUNNING
```

## Common Issues and Solutions

### Camera Not Working
- **Issue**: Camera doesn't activate
- **Solution**: 
  - Use HTTPS or localhost
  - Grant camera permissions in browser
  - Check browser console for errors

### API Key Error
- **Issue**: Recognition fails with authentication error
- **Solution**:
  - Verify OPENAI_API_KEY in .env
  - Check API key format (starts with sk-)
  - Verify API key is valid and has credits

### Database Connection Error
- **Issue**: Backend can't connect to database
- **Solution**:
  - Wait for PostgreSQL to fully initialize (can take 30-60 seconds)
  - Check logs: `docker compose logs postgres`
  - Restart: `docker compose restart backend`

### Rate Limit Errors
- **Issue**: Receiving 429 errors
- **Solution**:
  - Wait 15 minutes for rate limit to reset
  - Reduce request frequency
  - Check if multiple users are testing

## Performance Testing

### Response Time
```bash
# Test API response time
time curl http://localhost:8080/api/health
```

Expected: < 100ms

### Concurrent Users
Use a tool like Apache Bench:
```bash
ab -n 100 -c 10 http://localhost:8080/api/health
```

Monitor logs during test:
```bash
docker compose logs -f backend
```

## Cleanup

```bash
# Stop all services
docker compose down

# Remove volumes (deletes database data)
docker compose down -v

# Remove images
docker compose down --rmi all
```

## Automated Testing

For automated testing, you can create test scripts:

```bash
#!/bin/bash
# Example automated test script

API_URL="http://localhost:8080/api"

# Test health endpoint
echo "Testing health endpoint..."
response=$(curl -s "$API_URL/health")
if echo "$response" | grep -q "ok"; then
  echo "✓ Health check passed"
else
  echo "✗ Health check failed"
  exit 1
fi

# Add more tests...
```

## Test Report Template

Document your testing:

```
# Test Report - ASL Teacher

Date: ____________________
Tester: __________________

## Environment
- OS: _______________
- Docker Version: _______________
- Browser: _______________

## Test Results
- [ ] Setup verification passed
- [ ] Application builds successfully
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Learn mode functions properly
- [ ] Test mode completes successfully
- [ ] API endpoints respond correctly
- [ ] Rate limiting works
- [ ] Database stores data correctly
- [ ] Logs show no errors

## Issues Found
1. ____________________
2. ____________________

## Notes
____________________
```

## Next Steps

After testing:
1. Review logs for any warnings or errors
2. Verify all test IDs start with "ASL"
3. Check database for stored results
4. Test from different browsers/devices
5. Monitor resource usage (CPU, memory)

For production deployment, refer to ARCHITECTURE.md for scaling considerations.
