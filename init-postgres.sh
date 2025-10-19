#!/bin/bash

# Initialize PostgreSQL
if [ ! -d "/var/lib/postgresql/data/base" ]; then
    echo "Initializing PostgreSQL database..."
    su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/data"
fi

# Start PostgreSQL
su - postgres -c "/usr/lib/postgresql/13/bin/postgres -D /var/lib/postgresql/data" &

# Wait for PostgreSQL to start
sleep 5

# Create database if it doesn't exist
su - postgres -c "psql -lqt | cut -d \| -f 1 | grep -qw asl_teacher" || \
su - postgres -c "createdb asl_teacher"

# Keep the script running
wait
