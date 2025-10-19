#!/bin/bash

# ASL Teacher - Setup and Test Script
# This script helps verify the installation and basic functionality

set -e

echo "======================================"
echo "ASL Teacher - Setup Verification"
echo "======================================"
echo ""

# Check for Docker
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed: $(docker --version)"
else
    echo "✗ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for Docker Compose
echo "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose is installed: $(docker-compose --version)"
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    echo "✓ Docker Compose is installed: $(docker compose version)"
    COMPOSE_CMD="docker compose"
else
    echo "✗ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for .env file
echo ""
echo "Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✓ .env file found"
    
    # Check if OPENAI_API_KEY is set
    if grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
        echo "⚠ WARNING: Please update OPENAI_API_KEY in .env file"
    elif grep -q "OPENAI_API_KEY=" .env; then
        # Extract and validate API key format
        API_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d '=' -f2)
        if [[ $API_KEY == sk-* ]]; then
            echo "✓ OPENAI_API_KEY is configured with valid format"
        else
            echo "⚠ WARNING: OPENAI_API_KEY does not appear to be in valid format (should start with 'sk-')"
        fi
    else
        echo "⚠ WARNING: OPENAI_API_KEY not found in .env file"
    fi
else
    echo "⚠ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "⚠ Please edit .env file and add your OpenAI API key"
    exit 1
fi

echo ""
echo "======================================"
echo "File Structure Check"
echo "======================================"

# Check critical files
FILES=(
    "Dockerfile"
    "docker-compose.yml"
    "supervisord.conf"
    "nginx.conf"
    "init-postgres.sh"
    "backend/server.js"
    "backend/db.js"
    "backend/package.json"
    "frontend/package.json"
    "frontend/src/App.js"
    "frontend/src/index.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (missing)"
    fi
done

echo ""
echo "======================================"
echo "Build Information"
echo "======================================"
echo ""
echo "To build and run the application:"
echo "  $COMPOSE_CMD up --build"
echo ""
echo "Once running, access the app at:"
echo "  http://localhost:8080"
echo ""
echo "To stop the application:"
echo "  $COMPOSE_CMD down"
echo ""
echo "To view logs:"
echo "  $COMPOSE_CMD logs -f"
echo ""
echo "======================================"
echo "Setup verification complete!"
echo "======================================"
