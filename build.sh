#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit  # exit on error

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create database tables (will run on first deployment)
python -c "
import os
os.environ.setdefault('FLASK_APP', 'main.py')
from app import app, db
with app.app_context():
    db.create_all()
    print('Database tables created successfully!')
"
