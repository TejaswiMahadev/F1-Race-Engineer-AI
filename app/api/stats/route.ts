import { NextResponse } from "next/server"

// These would be imported from a shared state management solution in a real app
// For now, we'll simulate the stats
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

const interactionCounter = 0
const contextMemory = {
  current_focus: "general",
}

export async function GET() {
  try {
    const kbSuccessRate =
      sourceStatistics.kb_attempts > 0
        ? ((sourceStatistics.kb_success / sourceStatistics.kb_attempts) * 100).toFixed(1)
        : "0.0"

    const webSuccessRate =
      sourceStatistics.web_attempts > 0
        ? ((sourceStatistics.web_success / sourceStatistics.web_attempts) * 100).toFixed(1)
        : "0.0"

    return NextResponse.json({
      total_interactions: interactionCounter,
      source_statistics: sourceStatistics,
      success_rates: {
        kb_success_rate: `${kbSuccessRate}%`,
        web_success_rate: `${webSuccessRate}%`,
      },
      current_focus: contextMemory.current_focus,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
