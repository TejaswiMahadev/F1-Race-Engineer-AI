import { NextResponse } from "next/server"

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5000"

export async function GET() {
  try {
    // Check service health
    const healthResponse = await fetch(`${PYTHON_SERVICE_URL}/health`)
    const healthData = await healthResponse.json()

    if (!healthResponse.ok) {
      return NextResponse.json({
        service_status: "unhealthy",
        error: "Python FAISS service is not available",
        service_url: PYTHON_SERVICE_URL,
      })
    }

    // Get vectorstore info
    const infoResponse = await fetch(`${PYTHON_SERVICE_URL}/info`)
    const infoData = await infoResponse.json()

    return NextResponse.json({
      service_status: "healthy",
      service_url: PYTHON_SERVICE_URL,
      health_check: healthData,
      vectorstore_info: infoData,
    })
  } catch (error) {
    return NextResponse.json({
      service_status: "error",
      error: `Failed to connect to Python service: ${error}`,
      service_url: PYTHON_SERVICE_URL,
    })
  }
}
