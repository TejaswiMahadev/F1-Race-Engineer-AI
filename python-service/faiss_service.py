import os
import json
import sys
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import FAISS
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings
)

# Get environment variables
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
PORT = int(os.environ.get("PORT", 5000))

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

app = Flask(__name__)
CORS(app)  # Enable CORS for Vercel communication

class FAISSService:
    def __init__(self, index_path=None):
        """Initialize FAISS service with your existing knowledge base"""
        if index_path is None:
            index_path = os.environ.get("FAISS_INDEX_PATH", "./index")
        try:
            print("🔧 Initializing FAISS service...")
            
            # Initialize embeddings (same as your Python app)
            self.embedding = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=GOOGLE_API_KEY
            )
            
            # Load your existing FAISS vectorstore
            self.vectorstore = FAISS.load_local(
                index_path, 
                self.embedding, 
                allow_dangerous_deserialization=True
            )
            
            # Create retriever
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 4})
            
            # Initialize Gemini LLM (same configuration as your Python app)
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0.2,
                google_api_key=GOOGLE_API_KEY,
                system_message=(
                    "You are a Formula 1 Race Engineer AI. "
                    "Answer queries based on official FIA documents and race radio transcripts from the 2025 season. "
                    "Use technical language and provide specific data. If comparing sources, be analytical and precise."
                )
            )
            
            # Create RetrievalQA chain
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                retriever=self.retriever,
                return_source_documents=True,
                chain_type="stuff"
            )
            
            print("✅ FAISS service initialized successfully")
            
        except Exception as e:
            print(f"❌ Failed to initialize FAISS service: {e}")
            raise e
    
    def query_knowledge_base(self, query):
        """Query the FAISS knowledge base"""
        try:
            print(f"📚 Querying FAISS KB: {query}")
            
            # Use the same QA chain as your Python app
            result = self.qa_chain(query)
            
            if result and result["result"]:
                response = result["result"].strip()
                
                # Extract source documents metadata
                docs_info = []
                if "source_documents" in result:
                    for doc in result["source_documents"]:
                        docs_info.append({
                            "content": doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content,
                            "metadata": doc.metadata,
                            "source": doc.metadata.get('source', 'Unknown'),
                            "grand_prix": doc.metadata.get('grand_prix', 'Unknown GP'),
                            "type": doc.metadata.get('type', 'document')
                        })
                
                # Evaluate quality (same logic as your Python app)
                quality_check = self.evaluate_response_quality(response, query)
                
                return {
                    "success": True,
                    "response": response,
                    "docs": docs_info,
                    "quality_check": quality_check["status"],
                    "quality_reason": quality_check["reason"],
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "response": "No response from knowledge base",
                    "docs": [],
                    "quality_check": "failed",
                    "quality_reason": "No response generated"
                }
                
        except Exception as e:
            print(f"❌ FAISS query error: {e}")
            return {
                "success": False,
                "response": f"Knowledge base query failed: {str(e)}",
                "docs": [],
                "quality_check": "failed",
                "quality_reason": f"Exception: {str(e)}"
            }
    
    def evaluate_response_quality(self, response, query):
        """Evaluate response quality (same logic as your Python app)"""
        if not response or len(response.strip()) < 10:
            return {"status": "failed", "reason": "Response too short"}
        
        response_lower = response.lower()
        
        # Check for insufficient response indicators
        no_info_indicators = [
            "does not contain information", "i don't know", "not available",
            "no information", "cannot find", "insufficient information",
            "not mentioned", "no details", "not specified", "unable to find",
            "don't have information", "no relevant information", "cannot provide",
            "not found", "no specific", "unclear", "uncertain", "cannot determine"
        ]
        
        for indicator in no_info_indicators:
            if indicator in response_lower:
                return {"status": "failed", "reason": f"Found indicator: {indicator}"}
        
        # Check for F1-specific content
        f1_keywords = [
            "formula 1", "f1", "fia", "grand prix", "gp", "circuit", "track",
            "driver", "team", "constructor", "championship", "points", "qualifying",
            "practice", "race", "session", "lap", "sector", "drs", "ers",
            "tire", "tyre", "compound", "pit", "strategy", "fuel", "regulation",
            "technical", "aerodynamics", "engine", "power unit"
        ]
        
        f1_content_count = sum(1 for keyword in f1_keywords if keyword in response_lower)
        if f1_content_count < 2:
            return {"status": "failed", "reason": f"Insufficient F1-specific content ({f1_content_count} keywords)"}
        
        return {"status": "passed", "reason": "Response appears comprehensive"}
    
    def get_vectorstore_info(self):
        """Get information about the vectorstore"""
        try:
            total_docs = self.vectorstore.index.ntotal if hasattr(self.vectorstore, 'index') else "Unknown"
            
            # Get sample documents
            sample_docs = self.vectorstore.similarity_search("F1", k=5)
            
            sources = set()
            doc_types = set()
            grand_prix_list = set()
            
            for doc in sample_docs:
                if 'source' in doc.metadata:
                    sources.add(doc.metadata['source'])
                if 'type' in doc.metadata:
                    doc_types.add(doc.metadata['type'])
                if 'grand_prix' in doc.metadata:
                    grand_prix_list.add(doc.metadata['grand_prix'])
            
            return {
                "total_documents": total_docs,
                "sample_sources": list(sources)[:10],
                "document_types": list(doc_types),
                "grand_prix_coverage": list(grand_prix_list)[:10],
                "service_status": "active",
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e), "service_status": "error"}

# Initialize the FAISS service
try:
    faiss_service = FAISSService()
except Exception as e:
    print(f"Failed to initialize FAISS service: {e}")
    faiss_service = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if faiss_service:
        return jsonify({"status": "healthy", "service": "FAISS Knowledge Base"})
    else:
        return jsonify({"status": "unhealthy", "error": "FAISS service not initialized"}), 500

@app.route('/query', methods=['POST'])
def query_endpoint():
    """Main query endpoint"""
    if not faiss_service:
        return jsonify({"error": "FAISS service not available"}), 500
    
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        result = faiss_service.query_knowledge_base(query)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Query processing failed: {str(e)}"}), 500

@app.route('/info', methods=['GET'])
def vectorstore_info():
    """Get vectorstore information"""
    if not faiss_service:
        return jsonify({"error": "FAISS service not available"}), 500
    
    try:
        info = faiss_service.get_vectorstore_info()
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": f"Failed to get vectorstore info: {str(e)}"}), 500

@app.route('/similarity_search', methods=['POST'])
def similarity_search():
    """Direct similarity search endpoint"""
    if not faiss_service:
        return jsonify({"error": "FAISS service not available"}), 500
    
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        k = data.get('k', 4)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        docs = faiss_service.vectorstore.similarity_search(query, k=k)
        
        results = []
        for doc in docs:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "source": doc.metadata.get('source', 'Unknown'),
                "grand_prix": doc.metadata.get('grand_prix', 'Unknown GP'),
                "type": doc.metadata.get('type', 'document')
            })
        
        return jsonify({
            "success": True,
            "results": results,
            "count": len(results)
        })
        
    except Exception as e:
        return jsonify({"error": f"Similarity search failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🏁 Starting FAISS Microservice for F1 Race Engineer AI")
    print(f"🔧 Service will be available at http://0.0.0.0:{PORT}")
    print("📚 Endpoints:")
    print("  - GET  /health - Health check")
    print("  - POST /query - Main knowledge base query")
    print("  - GET  /info - Vectorstore information")
    print("  - POST /similarity_search - Direct similarity search")
    
    app.run(host='0.0.0.0', port=PORT, debug=False)
