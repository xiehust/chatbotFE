#!/bin/bash

# Start virtual environment
source .venv/bin/activate

# Set environment variables


# Start the Flask application
# python app.py

pm2 start app.py --name "agent_demohub_backend" --interpreter ./.venv/bin/python3