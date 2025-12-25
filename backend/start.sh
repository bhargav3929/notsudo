#!/bin/bash
# Start the CloudAgentPR backend server
# Usage: ./start.sh

cd "$(dirname "$0")"

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the Flask server
python3 app.py
