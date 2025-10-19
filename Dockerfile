FROM node:18-bullseye

# Install PostgreSQL
RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    supervisor \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend files
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install

# Copy frontend files
COPY frontend /app/frontend
WORKDIR /app/frontend
RUN npm install
RUN REACT_APP_API_URL=/api npm run build

# Configure nginx
COPY nginx.conf /etc/nginx/sites-available/default

# Configure supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create postgres data directory
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql

# Setup postgres initialization script
COPY init-postgres.sh /app/init-postgres.sh
RUN chmod +x /app/init-postgres.sh

# Expose port
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=asl_teacher
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV PORT=3001

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
