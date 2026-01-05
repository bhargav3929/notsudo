#!/bin/bash
# Start the CloudAgentPR backend server with ngrok tunnel
# Usage: ./start.sh

cd "$(dirname "$0")"

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start ngrok in background if available
if command -v ngrok &> /dev/null; then
    echo "Starting ngrok tunnel..."
    ngrok start python &> /dev/null &
    NGROK_PID=$!
    sleep 2
    echo "ngrok started (PID: $NGROK_PID)"
    echo "Check ngrok URL at: http://localhost:4040"
fi

# Run the Flask server
python3 app.py

# Cleanup ngrok on exit
if [ ! -z "$NGROK_PID" ]; then
    kill $NGROK_PID 2>/dev/null
fi
