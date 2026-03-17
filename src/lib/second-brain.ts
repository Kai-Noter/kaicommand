import { db } from './db'

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is missing. Ensure you have one set in .env to power the Second Brain Omni-Search.")
    return Array(1536).fill(0) // Return a dummy zero vector if no key is present to prevent crashes
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small"
      })
    })

    if (!res.ok) {
      throw new Error(`OpenAI API Error: ${res.statusText}`)
    }

    const data = await res.json()
    return data.data[0].embedding
  } catch (err) {
    console.error("Failed to generate embedding", err)
    return Array(1536).fill(0)
  }
}

export async function indexKnowledgeNode(params: {
  userId: string
  nodeType: string
  referenceId: string
  content: string
}) {
  const { userId, nodeType, referenceId, content } = params

  // 1. Generate the embedding vector
  const embedding = await generateEmbedding(content)
  const vectorString = `[${embedding.join(',')}]`

  // 2. We use a Raw SQL Upsert here because Prisma's Unsupported("vector") 
  // currently handles string injections better via queryRaw.
  await db.$executeRaw`
    INSERT INTO "KnowledgeNode" ("id", "nodeType", "referenceId", "content", "userId", "updatedAt", "embedding")
    VALUES (
      gen_random_uuid()::text, 
      ${nodeType}, 
      ${referenceId}, 
      ${content}, 
      ${userId}, 
      CURRENT_TIMESTAMP, 
      ${vectorString}::vector
    )
    ON CONFLICT ("nodeType", "referenceId") DO UPDATE SET
      "content" = ${content},
      "embedding" = ${vectorString}::vector,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "KnowledgeNode"."userId" = ${userId};
  `
}

export async function searchKnowledgeGraph(userId: string, query: string, limit: number = 5) {
  // 1. Convert the user's natural language query into a mathematical vector
  const queryVector = await generateEmbedding(query)
  const vectorString = `[${queryVector.join(',')}]`

  // 2. Perform a Cosine Distance order using pgvector's <=> operator
  // 1 - cosine_distance = cosine_similarity
  const results = await db.$queryRaw<Array<{
    id: string
    nodeType: string
    referenceId: string
    content: string
    similarity: number
  }>>`
    SELECT 
      id, 
      "nodeType", 
      "referenceId", 
      content,
      1 - (embedding <=> ${vectorString}::vector) AS similarity
    FROM "KnowledgeNode"
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${vectorString}::vector ASC
    LIMIT ${limit};
  `

  return results
}

/**
 * Extracts entities from content and forms Semantic Edges between related nodes.
 * E.g., linking a new VoiceNote mentioning "AWS" to the AWS Password Vault Entry.
 */
export async function extractAndLinkEntities(sourceNodeId: string, content: string) {
    // This function will be fleshed out with an LLM call to extract proper nouns 
    // and automatically insert into the KnowledgeEdge table dynamically.
    console.log("Entity Graph Linker triggered for node:", sourceNodeId)
}
