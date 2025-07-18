import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

// Python service configuration
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5000"

// In-memory storage for conversation history and stats (internal only)
const conversationHistory: Array<{ query: string; timestamp: string }> = []
const sourceStatistics = {
  dual_source_validated: 0,
  kb_primary_web_supplement: 0,
  web_primary_kb_insufficient: 0,
  dual_source_insufficient: 0,
  kb_attempts: 0,
  web_attempts: 0,
  kb_success: 0,
  web_success: 0,
}
let interactionCounter = 0

// Context memory (internal only)
const contextMemory = {
  current_focus: "general",
  session_context: "F1 Dual-Source Race Engineer session started",
  frequently_asked: {} as Record<string, number>,
}

async function getContextAnalysis(query: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const contextPrompt = `As an F1 Race Engineer AI, analyze this query with contextual awareness: "${query}"

Current focus area: ${contextMemory.current_focus}
Session context: ${contextMemory.session_context}

Provide a brief contextual analysis focusing on F1 technical aspects, regulations, and strategy. 
Consider what type of information would be most valuable.
Note if this requires current/live information or historical data.`

  try {
    const result = await model.generateContent(contextPrompt)
    return result.response.text()
  } catch (error) {
    return `Context analysis: Processing F1 query about ${query} (Focus: ${contextMemory.current_focus})`
  }
}

async function queryKnowledgeBase(query: string) {
  console.log("📚 Querying Python FAISS service...")
  sourceStatistics.kb_attempts += 1

  try {
    // Check if Python service is available
    const healthResponse = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!healthResponse.ok) {
      throw new Error("Python FAISS service is not available")
    }

    // Query the Python FAISS service
    const response = await fetch(`${PYTHON_SERVICE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.quality_check === "passed") {
      console.log("✅ FAISS service provided quality response")
      sourceStatistics.kb_success += 1
      return {
        source: "local",
        response: result.response,
        docs: result.docs,
        quality_check: "passed",
        quality_reason: result.quality_reason,
      }
    } else {
      console.log(`⚠️ FAISS service response insufficient: ${result.quality_reason}`)
      return {
        source: "local",
        response: result.response,
        docs: result.docs || [],
        quality_check: "failed",
        quality_reason: result.quality_reason,
      }
    }
  } catch (error) {
    console.error("❌ FAISS service query failed:", error)
    return {
      source: "local",
      response: `Knowledge base service unavailable: ${error}`,
      docs: [],
      quality_check: "failed",
      quality_reason: `Service error: ${error}`,
    }
  }
}

async function searchWeb(query: string) {
  console.log("🌐 Searching web for current F1 information...")
  sourceStatistics.web_attempts += 1

  if (!process.env.SERPAPI_API_KEY) {
    return {
      source: "web",
      response: "Web search unavailable. SerpAPI key not configured.",
      success: false,
    }
  }

  try {
    const searchQuery = `Formula 1 F1 ${query} 2025 official FIA`
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&api_key=${process.env.SERPAPI_API_KEY}&num=10&hl=en&gl=us`,
    )

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`)
    }

    const results = await response.json()

    if (results.error) {
      return {
        source: "web",
        response: `Web search error: ${results.error}`,
        success: false,
      }
    }

    const snippets: string[] = []
    if (results.organic_results) {
      for (const res of results.organic_results) {
        const title = res.title || ""
        const snippet = res.snippet || ""
        const link = res.link || ""

        if (
          ["formula 1", "f1", "grand prix", "fia", "motorsport", "racing"].some((term) =>
            (title + snippet).toLowerCase().includes(term),
          )
        ) {
          snippets.push(`**${title}**\n${snippet}\nSource: ${link}\n`)
        }
      }
    }

    if (snippets.length === 0) {
      return {
        source: "web",
        response: "No current F1 information found for this query.",
        success: false,
      }
    }

    const searchSummary = snippets.slice(0, 8).join("\n")

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: `You are a Formula 1 Race Engineer AI. Focus on technical details, specifications, and current regulations. Use F1 technical terminology and provide specific data where available.`,
    })

    const prompt = `Using the following current web search results, provide a comprehensive and technical response for: "${query}"

${searchSummary}

Instructions:
- Focus on technical details and current regulations
- Use F1 technical terminology
- Mention strategic implications
- Cite specific sources when mentioning facts
- Prioritize current 2025 season information
- Provide a clean, professional response without showing internal processing
- Do not mention document sources or references`

    const webResponse = await model.generateContent(prompt)
    const responseText = webResponse.response.text()

    if (responseText.length < 50) {
      return {
        source: "web",
        response: "Web search completed but response quality insufficient.",
        success: false,
      }
    }

    sourceStatistics.web_success += 1
    return {
      source: "web",
      response: responseText,
      raw: searchSummary,
      success: true,
      results_count: snippets.length,
    }
  } catch (error) {
    console.error("Web search failed:", error)
    return {
      source: "web",
      response: `Web search encountered an error: ${error}`,
      success: false,
    }
  }
}

async function generateCleanResponse(query: string, kbResult: any, webResult: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `You are a Formula 1 Race Engineer AI. Provide clean, professional responses without showing internal processing, quality assessments, validation details, or document references. Focus on delivering the technical information the user needs in a clear, authoritative manner.`,
  })

  const kbQuality = kbResult && kbResult.quality_check === "passed"
  const webQuality = webResult && webResult.success

  let sourceContent = ""
  let responseType = ""

  if (kbQuality && webQuality) {
    // Both sources available - combine them
    sourceContent = `Knowledge Base Information:\n${kbResult.response}\n\nCurrent Web Information:\n${webResult.response}`
    responseType = "dual_source_validated"
    sourceStatistics.dual_source_validated += 1
  } else if (kbQuality && !webQuality) {
    // KB primary
    sourceContent = kbResult.response
    responseType = "kb_primary_web_supplement"
    sourceStatistics.kb_primary_web_supplement += 1
  } else if (!kbQuality && webQuality) {
    // Web primary
    sourceContent = webResult.response
    responseType = "web_primary_kb_insufficient"
    sourceStatistics.web_primary_kb_insufficient += 1
  } else {
    // Both insufficient - provide general guidance
    responseType = "dual_source_insufficient"
    sourceStatistics.dual_source_insufficient += 1

    const fallbackPrompt = `The user asked: "${query}"

Provide a helpful F1 Race Engineer response based on your general knowledge of Formula 1 technical regulations, procedures, and best practices. Focus on what you can provide about this topic without mentioning source limitations.`

    try {
      const fallbackResult = await model.generateContent(fallbackPrompt)
      sourceContent = fallbackResult.response.text()
    } catch (error) {
      sourceContent =
        "I apologize, but I'm having difficulty accessing specific information about this topic right now. Could you try rephrasing your question or asking about a different F1 technical aspect?"
    }
  }

  // Generate the final clean response
  const cleanPrompt = `Based on the following information about "${query}", provide a clean, professional F1 Race Engineer response:

${sourceContent}

Instructions:
- Provide a comprehensive, technical response
- Use proper F1 terminology and technical language
- Structure the information clearly with proper formatting
- Include strategic implications where relevant
- Do not mention sources, quality checks, internal processing, or document references
- Do not show any "Referenced from X documents" sections
- Focus on delivering valuable technical information directly
- Keep the tone professional and authoritative
- Format the response with clear sections using markdown-style headers if needed`

  try {
    const cleanResult = await model.generateContent(cleanPrompt)
    return {
      source: responseType,
      response: cleanResult.response.text(),
      internal_quality_scores: { kb: kbQuality ? "HIGH" : "LOW", web: webQuality ? "HIGH" : "LOW" },
      internal_fallback_triggered: responseType === "dual_source_insufficient",
    }
  } catch (error) {
    return {
      source: "error",
      response: "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
      internal_quality_scores: { kb: "ERROR", web: "ERROR" },
      internal_fallback_triggered: true,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }

    // Store conversation (internal)
    conversationHistory.push({
      query,
      timestamp: new Date().toISOString(),
    })

    // Update frequently asked (internal)
    const queryLower = query.toLowerCase()
    contextMemory.frequently_asked[queryLower] = (contextMemory.frequently_asked[queryLower] || 0) + 1

    // Internal processing - not shown to user
    console.log("🔧 Processing with dual-source context management...")

    // Step 1: Query FAISS knowledge base (internal)
    console.log("🔍 Step 1: Querying FAISS knowledge base...")
    const kbResult = await queryKnowledgeBase(query)

    // Step 2: Query web search (internal)
    console.log("🌐 Step 2: Querying web search...")
    const webResult = await searchWeb(query)

    // Step 3: Generate clean response for user
    const finalResponse = await generateCleanResponse(query, kbResult, webResult)

    interactionCounter += 1

    // Return only the clean response to the user (no docs or internal data)
    return NextResponse.json({
      source: finalResponse.source,
      response: finalResponse.response,
      // Internal data for analytics only (not shown in main response)
      _internal: {
        quality_scores: finalResponse.internal_quality_scores,
        fallback_triggered: finalResponse.internal_fallback_triggered,
        interaction_id: interactionCounter,
      },
    })
  } catch (error) {
    console.error("Query processing error:", error)
    return NextResponse.json(
      {
        source: "error",
        response:
          "I apologize, but I'm experiencing technical difficulties processing your request. Please try again in a moment.",
      },
      { status: 500 },
    )
  }
}
