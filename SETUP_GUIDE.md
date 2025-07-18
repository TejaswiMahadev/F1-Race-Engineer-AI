# F1 Race Engineer AI - Python FAISS Integration Setup

## Prerequisites

1. **Python 3.11+** installed
2. **Node.js 18+** installed
3. **Your existing FAISS index** from the original Python application
4. **API Keys**: Google AI API Key and SerpAPI Key

## Setup Steps

### 1. Prepare Your FAISS Index

Copy your existing FAISS index directory to the project root:
\`\`\`bash
cp -r /path/to/your/faiss/index ./index
\`\`\`

The index directory should contain:
- `index.faiss` (the FAISS index file)
- `index.pkl` (the document store)

### 2. Set Up Python Microservice

\`\`\`bash
# Navigate to python service directory
cd python-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Make startup script executable
chmod +x start_service.sh
\`\`\`

### 3. Configure Environment Variables

Create `.env.local` in the project root:
\`\`\`env
GOOGLE_API_KEY=your_google_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here
PYTHON_SERVICE_URL=http://localhost:5000
\`\`\`

### 4. Start the Services

**Option A: Manual Start**
\`\`\`bash
# Terminal 1: Start Python FAISS service
cd python-service
./start_service.sh

# Terminal 2: Start Next.js application
npm run dev
\`\`\`

**Option B: Docker Compose**
\`\`\`bash
# Start both services with Docker
docker-compose up --build
\`\`\`

### 5. Verify Setup

1. **Check Python service**: Visit `http://localhost:5000/health`
2. **Check FAISS info**: Visit `http://localhost:5000/info`
3. **Test Next.js app**: Visit `http://localhost:3000`

## API Endpoints

### Python FAISS Service (Port 5000)

- `GET /health` - Health check
- `POST /query` - Main knowledge base query
- `GET /info` - Vectorstore information
- `POST /similarity_search` - Direct similarity search

### Next.js Application (Port 3000)

- `POST /api/query` - Main AI query endpoint
- `GET /api/stats` - System statistics
- `GET /api/faiss-info` - FAISS service information

## Testing the Integration

\`\`\`bash
# Test Python service directly
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the tire compound regulations for 2025?"}'

# Test through Next.js API
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the tire compound regulations for 2025?"}'
\`\`\`

## Troubleshooting

### Python Service Issues

1. **FAISS index not found**: Ensure your index directory is in the correct location
2. **Import errors**: Check that all dependencies are installed in the virtual environment
3. **Port conflicts**: Change the port in `faiss_service.py` if 5000 is occupied

### Next.js Integration Issues

1. **Service unavailable**: Ensure Python service is running on the correct port
2. **CORS errors**: The Flask service includes CORS headers for Next.js communication
3. **Environment variables**: Verify all required environment variables are set

### Performance Optimization

1. **Index loading**: The FAISS index is loaded once at startup for better performance
2. **Connection pooling**: Consider using connection pooling for high-traffic scenarios
3. **Caching**: Implement Redis caching for frequently asked questions

## Production Deployment

For production deployment:

1. **Use Docker Compose** for consistent environments
2. **Set up reverse proxy** (nginx) for the Python service
3. **Configure health checks** and monitoring
4. **Use environment-specific configurations**
5. **Implement proper logging** and error tracking

## Migration from Original Python App

Your original Python application's FAISS index and embeddings are fully compatible. The microservice uses the same:

- `GoogleGenerativeAIEmbeddings` model
- `FAISS.load_local()` method
- `RetrievalQA` chain configuration
- Quality evaluation logic

This ensures seamless migration of your existing knowledge base.
