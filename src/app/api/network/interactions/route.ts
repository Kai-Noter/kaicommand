import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getServerSession } from "next-auth";

/**
 * GET /api/network/interactions
 * Retrieves interactions for a specific person or business, or all recent interactions.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const personId = searchParams.get("personId");
    const businessId = searchParams.get("businessId");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Build the query where clause
    const whereClause: any = { userId: user.id };
    if (personId) whereClause.personId = personId;
    if (businessId) whereClause.businessId = businessId;

    const interactions = await prisma.interaction.findMany({
      where: whereClause,
      include: {
        person: true,
        business: true
      },
      orderBy: { date: 'desc' },
      take: 50 // Limit to 50 most recent by default
    });

    return NextResponse.json(interactions);
  } catch (error) {
    console.error("GET /api/network/interactions error:", error);
    return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 });
  }
}

/**
 * POST /api/network/interactions
 * Logs a new interaction (meeting, call, note) with a person or business.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, summary, sentiment, personId, businessId, date } = await req.json();

    if (!type || !summary) {
      return NextResponse.json({ error: "Type and summary are required" }, { status: 400 });
    }
    
    if (!personId && !businessId) {
      return NextResponse.json({ error: "Must link to either a person or a business" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const interactionData: any = {
      type,
      summary,
      sentiment: sentiment || "neutral",
      userId: user.id
    };

    if (date) interactionData.date = new Date(date);
    if (personId) interactionData.personId = personId;
    if (businessId) interactionData.businessId = businessId;

    const newInteraction = await prisma.interaction.create({
      data: interactionData,
      include: {
        person: true,
        business: true
      }
    });

    return NextResponse.json(newInteraction);
  } catch (error) {
    console.error("POST /api/network/interactions error:", error);
    return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 });
  }
}
