"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, History, Database, Globe, Brain, CheckCircle, Info, Trophy, Loader2 } from "lucide-react"
import { RaceCarLogo } from "@/components/race-car-logo"

interface QueryResponse {
  source: string
  response: string
  docs?: Array<{ metadata: any; page_content: string }>
  _internal?: {
    quality_scores?: { kb: string; web: string }
    fallback_triggered?: boolean
    interaction_id?: number
  }
}

export default function F1RaceEngineerAI() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [responses, setResponses] = useState<Array<{ query: string; response: QueryResponse; timestamp: string }>>([])
  const [activeTab, setActiveTab] = useState("chat")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [responses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setIsTyping(true)
    const currentQuery = query
    setQuery("")

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data: QueryResponse = await response.json()

      // Simulate typing delay for better UX
      setTimeout(() => {
        setResponses((prev) => [
          ...prev,
          {
            query: currentQuery,
            response: data,
            timestamp: new Date().toISOString(),
          },
        ])
        setIsTyping(false)
      }, 500)
    } catch (error) {
      console.error("Error:", error)
      setTimeout(() => {
        setResponses((prev) => [
          ...prev,
          {
            query: currentQuery,
            response: {
              source: "error",
              response: "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
            },
            timestamp: new Date().toISOString(),
          },
        ])
        setIsTyping(false)
      }, 500)
    } finally {
      setLoading(false)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "dual_source_validated":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "kb_primary_web_supplement":
        return <Database className="h-4 w-4 text-blue-500" />
      case "web_primary_kb_insufficient":
        return <Globe className="h-4 w-4 text-orange-500" />
      case "dual_source_insufficient":
        return <Brain className="h-4 w-4 text-purple-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "dual_source_validated":
        return "Comprehensive"
      case "kb_primary_web_supplement":
        return "Technical"
      case "web_primary_kb_insufficient":
        return "Current"
      case "dual_source_insufficient":
        return "General"
      default:
        return "Response"
    }
  }

  const formatResponse = (text: string) => {
    // Split text into paragraphs and process each one
    const paragraphs = text.split("\n\n").filter(Boolean)

    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim()

      // Main headers (##)
      if (trimmed.startsWith("## ")) {
        const title = trimmed.substring(3).trim()
        return (
          <div key={index} className="mb-6 mt-8 first:mt-0">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-3 border-b border-red-500/30 pb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-red-700 rounded-full"></div>
              {title}
            </h2>
          </div>
        )
      }

      // Sub headers (###)
      if (trimmed.startsWith("### ")) {
        const title = trimmed.substring(4).trim()
        return (
          <div key={index} className="mb-4 mt-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-yellow-500 rounded-full"></div>
              {title}
            </h3>
          </div>
        )
      }

      // Process inline formatting within paragraphs
      const processInlineFormatting = (text: string) => {
        const parts = []
        let currentIndex = 0

        // Regex to match various formatting patterns
        const patterns = [
          {
            regex: /\*\*\*([^*]+)\*\*\*/g,
            component: (match: string, content: string) => (
              <strong key={`bold-italic-${currentIndex++}`} className="font-bold italic text-orange-300">
                {content}
              </strong>
            ),
          },
          {
            regex: /\*\*([^*]+)\*\*/g,
            component: (match: string, content: string) => (
              <strong key={`bold-${currentIndex++}`} className="font-bold text-blue-300">
                {content}
              </strong>
            ),
          },
          {
            regex: /\*([^*]+)\*/g,
            component: (match: string, content: string) => (
              <em key={`italic-${currentIndex++}`} className="italic text-green-300">
                {content}
              </em>
            ),
          },
        ]

        const processedText = text
        const replacements: Array<{ start: number; end: number; component: React.ReactNode }> = []

        patterns.forEach((pattern) => {
          let match
          while ((match = pattern.regex.exec(text)) !== null) {
            replacements.push({
              start: match.index,
              end: match.index + match[0].length,
              component: pattern.component(match[0], match[1]),
            })
          }
          pattern.regex.lastIndex = 0 // Reset regex
        })

        // Sort replacements by start position (descending to avoid index shifting)
        replacements.sort((a, b) => b.start - a.start)

        // Apply replacements
        const result = text
        const components: React.ReactNode[] = []
        let lastEnd = text.length

        replacements.forEach((replacement) => {
          // Add text after this replacement
          if (lastEnd > replacement.end) {
            components.unshift(result.substring(replacement.end, lastEnd))
          }

          // Add the replacement component
          components.unshift(replacement.component)

          lastEnd = replacement.start
        })

        // Add remaining text at the beginning
        if (lastEnd > 0) {
          components.unshift(result.substring(0, lastEnd))
        }

        return components.length > 1 ? components : [text]
      }

      // Handle bullet points
      if (trimmed.startsWith("***") || trimmed.startsWith("* ")) {
        const bulletContent = trimmed.replace(/^\*+\s*/, "").trim()
        const formattedContent = processInlineFormatting(bulletContent)

        return (
          <div key={index} className="mb-3 flex items-start gap-3 ml-4">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-gray-200 leading-relaxed flex-1">{formattedContent}</div>
          </div>
        )
      }

      // Regular paragraphs
      const formattedContent = processInlineFormatting(trimmed)

      return (
        <div key={index} className="mb-4 text-gray-200 leading-relaxed">
          {formattedContent}
        </div>
      )
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <RaceCarLogo size={48} className="animate-pulse hover:scale-110 transition-transform duration-300" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-gradient">
                F1 Race Engineer AI
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Trophy className="h-4 w-4 text-yellow-400 animate-bounce" />
                <span className="text-sm text-gray-300">Advanced Formula 1 Technical Assistant</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Professional F1 technical analysis with comprehensive knowledge base and real-time information
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="chat"
              className="flex items-center gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all duration-200 hover:bg-red-700/50"
            >
              <Send className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all duration-200 hover:bg-red-700/50"
            >
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4 animate-fade-in">
            <Card className="h-[650px] flex flex-col bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-3 border-b border-gray-700 flex-shrink-0">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-red-500 animate-pulse" />
                  Race Engineer Console
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
                  <div className="p-6 space-y-6">
                    {responses.length === 0 && !isTyping && (
                      <div className="text-center text-gray-400 py-12 animate-fade-in">
                        <RaceCarLogo size={64} className="mx-auto mb-6 animate-float" />
                        <p className="text-xl font-medium text-gray-300 mb-3">Ready for F1 Technical Analysis</p>
                        <p className="text-sm max-w-md mx-auto leading-relaxed">
                          Ask me anything about Formula 1 technical regulations, strategy, or current race information!
                        </p>
                        <p className="text-xs mt-3 text-gray-500">
                          Professional technical assistance for all your F1 questions.
                        </p>
                      </div>
                    )}

                    {responses.map((item, index) => (
                      <div
                        key={index}
                        className="space-y-4 animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/80 transition-all duration-300">
                          <p className="font-medium text-gray-200 mb-2 text-base">{item.query}</p>
                          <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="animate-pulse">{getSourceIcon(item.response.source)}</div>
                              <Badge
                                variant="outline"
                                className="border-gray-600 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200"
                              >
                                {getSourceLabel(item.response.source)}
                              </Badge>
                            </div>

                            <div className="prose prose-sm max-w-none overflow-hidden">
                              <div className="space-y-4 leading-relaxed break-words hyphens-auto">
                                {formatResponse(item.response.response)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="space-y-4 animate-slide-up">
                        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <Brain className="h-4 w-4 text-purple-500 animate-pulse" />
                            <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800/50">
                              Processing
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Analyzing your query...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t border-gray-700 p-6 flex-shrink-0">
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask about F1 regulations, strategy, current race info..."
                      disabled={loading}
                      className="flex-1 bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 transition-all duration-200 h-12 text-base"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 h-12 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 animate-fade-in">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-red-500" />
                  Conversation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {responses.length === 0 ? (
                      <div className="text-center py-12 animate-fade-in">
                        <RaceCarLogo size={48} className="mx-auto mb-4 animate-float" />
                        <p className="text-gray-400 text-lg">No conversations yet</p>
                        <p className="text-sm text-gray-500 mt-2">Start asking questions to build your history</p>
                      </div>
                    ) : (
                      responses.map((item, index) => (
                        <div
                          key={index}
                          className="border border-gray-700 rounded-lg p-4 bg-gray-900/30 backdrop-blur-sm hover:bg-gray-900/50 transition-all duration-200 animate-slide-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <p className="font-medium text-sm text-gray-200 flex-1 pr-4">{item.query}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getSourceIcon(item.response.source)}
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {getSourceLabel(item.response.source)}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
