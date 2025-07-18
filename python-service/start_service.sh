#!/bin/bash

echo "🏁 Starting F1 FAISS Microservice..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📚 Installing requirements..."
pip install -r requirements.txt

# Set environment variables
export GOOGLE_API_KEY="AIzaSyBYLsFMvt68jRG8-_L0i48qc4eFs5K---U"

# Start the service
echo "🚀 Starting FAISS service on port 5000..."
python faiss_service.py
