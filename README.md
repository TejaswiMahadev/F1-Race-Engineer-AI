
# F1 Race Engineer AI - Next.js Version

A comprehensive Formula 1 Race Engineer AI system converted from Python to Next.js, featuring dual-source validation with FAISS knowledge base and web search integration.

## Features

- **Dual-Source Validation**: Combines local knowledge base with current web search
- **Quality Assessment**: Evaluates response quality from both sources
- **Cross-Validation**: Compares and validates information between sources
- **Context Management**: Tracks conversation history and user preferences
- **Advanced Analytics**: Success rates, source statistics, and trending topics
- **Responsive UI**: Modern interface with real-time chat and analytics

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with:

\`\`\`env
GOOGLE_API_KEY=your_google_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here
FAISS_INDEX_PATH=./knowledge_base/index
\`\`\`

### 2. API Keys Required

- **Google AI API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **SerpAPI Key**: Get from [SerpAPI](https://serpapi.com/users/sign_up)

### 3. FAISS Knowledge Base Integration

To connect your existing FAISS knowledge base:

1. **Install Python dependencies** in your project:
   \`\`\`bash
   pip install faiss-cpu langchain-community langchain-google-genai
   \`\`\`

2. **Create a Python service** (`scripts/faiss_service.py`):
   ```python
   import faiss
   import pickle
   from langchain_community.vectorstores import FAISS
   from langchain_google_genai import GoogleGenerativeAIEmbeddings
   
   def query_faiss_kb(query, index_path="./knowledge_base/index"):
       embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
       vectorstore = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
       retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
       
       docs = retriever.get_relevant_documents(query)
       return [{"content": doc.page_content, "metadata": doc.metadata} for doc in docs]
   \`\`\`

3. **Create API endpoint** (`app/api/faiss/route.ts`):
   \`\`\`typescript
   import { spawn } from 'child_process'
   
   export async function POST(request: Request) {
     const { query } = await request.json()
     
     return new Promise((resolve) => {
       const python = spawn('python', ['scripts/faiss_service.py', query])
       let result = ''
       
       python.stdout.on('data', (data) => {
         result += data.toString()
       })
       
       python.on('close', () => {
         resolve(Response.json(JSON.parse(result)))
       })
     })
   }
   \`\`\`

### 4. System Validation Settings (Internal)

The system validation settings are kept internal and not exposed in the UI:

- **Quality thresholds**: Minimum response length, F1 keyword density
- **Source reliability scoring**: KB vs Web preference algorithms  
- **Fallback triggers**: When to use alternative sources
- **Cross-validation rules**: How to compare and merge responses

These settings are configured in the API routes and can be adjusted in:
- `app/api/query/route.ts` - Main validation logic
- Quality assessment functions
- Source combination algorithms

## Usage

1. **Start the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Access the application** at `http://localhost:3000`

3. **Ask F1 questions** like:
   - "What are the current tire compound regulations for 2025?"
   - "Explain the DRS activation zones for Monaco GP"
   - "What's the latest on Red Bull's aerodynamic updates?"

## Architecture

- **Frontend**: Next.js 14 with App Router, React, Tailwind CSS
- **Backend**: Next.js API routes with Google Gemini integration
- **Knowledge Base**: FAISS vector database (Python integration)
- **Web Search**: SerpAPI for current information
- **Validation**: Dual-source quality assessment and cross-validation

## Key Components

- `app/page.tsx` - Main chat interface with analytics
- `app/api/query/route.ts` - Core AI processing logic
- `app/api/stats/route.ts` - Analytics and statistics
- Quality assessment functions
- Context management system
- Cross-validation algorithms

## Deployment

Deploy to Vercel with environment variables configured in the dashboard.

The system will automatically handle:
- Knowledge base queries
- Web search validation  
- Response quality assessment
- Cross-validation between sources
- Analytics tracking
