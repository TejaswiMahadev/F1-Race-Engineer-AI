# F1 Race Engineer AI - Next.js Version

A comprehensive Formula 1 Race Engineer AI system, converted from Python to Next.js, delivering advanced technical assistance for F1 topics. Features dual-source validation using a FAISS knowledge base and real-time web search integration for up-to-date, reliable answers.

## Features

- **Dual-Source Validation:** Answers combine a local knowledge base (FAISS) with current web search (SerpAPI) for accuracy.
- **Quality Assessment:** Evaluates and scores responses from both sources before presenting to the user.
- **Cross-Validation:** Automatically compares and merges information from knowledge base and web search.
- **Context Management:** Tracks conversation history and user preferences for personalized answers.
- **Advanced Analytics:** Reports success rates, source statistics, trending topics, and conversation metrics.
- **Responsive UI:** Modern Next.js interface with real-time chat, analytics, and professional F1 branding.

## Architecture

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS.
- **Backend:** Next.js API routes with Google Gemini integration.
- **Knowledge Base:** FAISS vector database (Python microservice).
- **Web Search:** SerpAPI for current F1 regulations, news, and updates.
- **Validation:** Dual-source quality assessment and cross-validation algorithms.

## Key Components

- Main chat UI with analytics display.
- Core AI processing and response validation.
- Analytics and statistics endpoint.
- FAISS knowledge base microservice.
- Quality assessment, context management, and cross-validation logic.

## Supported Languages & Technologies

- **TypeScript** (main application logic)
- **Python** (FAISS microservice)
- **Next.js** (React frontend and backend)
- **Tailwind CSS** (UI styling)
- **FAISS** (vector search engine)
- **SerpAPI** (web search integration)
- **Google Gemini** (AI language model for reasoning and response)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root:
```env
GOOGLE_API_KEY=your_google_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here
FAISS_INDEX_PATH=./knowledge_base/index
```

### 2. API Keys Required

- **Google AI API Key:** [Get from Google AI Studio](https://makersuite.google.com/app/apikey)
- **SerpAPI Key:** [Get from SerpAPI](https://serpapi.com/users/sign_up)

### 3. FAISS Knowledge Base Integration

- **Install Python dependencies:**
  ```bash
  pip install faiss-cpu langchain-community langchain-google-genai
  ```
- **Create Python service (`python-service/faiss_service.py`):**  
  This handles queries to your FAISS knowledge base using Google Gemini embeddings.
- **Create Next.js API endpoint (`app/api/faiss/route.ts`):**  
  Communicates with the Python service using child_process to query FAISS.

### 4. System Validation Settings (Internal)

- Quality thresholds (e.g., response length, F1 keyword density)
- Source scoring algorithms (knowledge base vs web search)
- Fallback triggers for reliability
- Cross-validation and merge rules

All validation logic is housed in API routes and dedicated algorithms.

### 5. Additional Python Setup

See `SETUP_GUIDE.md` for details on running the FAISS microservice:
- Prepare your FAISS index (`index.faiss`, `index.pkl`)
- Setup Python environment and dependencies
- Run the Python service alongside Next.js app

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```
2. **Access the app:**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Ask F1 questions:**  
   - "What are the current tire compound regulations for 2025?"
   - "Explain the DRS activation zones for Monaco GP."
   - "What's the latest on Red Bull's aerodynamic updates?"

## Deployment

- Deploy seamlessly to [Vercel](https://vercel.com) (recommended).
- Configure environment variables via the Vercel dashboard.
- Both knowledge base and web search validation handled automatically.


**Note:** Please ensure Python microservice changes remain compatible with the Next.js API endpoints. Contributions to analytics and validation logic are especially welcome!


## Maintainer

- [TejaswiMahadev](https://github.com/TejaswiMahadev)

## Live Demo

- [F1 Race Engineer AI](https://f1-race-engineer-ai.vercel.app)

---

Professional F1 technical analysis with a comprehensive knowledge base and real-time information.
