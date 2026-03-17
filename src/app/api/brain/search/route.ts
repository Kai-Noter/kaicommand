import { NextRequest, NextResponse } from "next/server"
import { getUserId } from "@/lib/api-auth"
import { searchKnowledgeGraph } from "@/lib/second-brain"

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { query, limit = 5 } = await req.json()
    
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const results = await searchKnowledgeGraph(userId, query, limit)
    
    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error("Knowledge Graph Search Error:", error)
    return NextResponse.json(
      { error: "Failed to perform semantic search" },
      { status: 500 }
    )
  }
}
