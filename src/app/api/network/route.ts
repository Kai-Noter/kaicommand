import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getServerSession } from "next-auth";

/**
 * GET /api/network
 * Retrieves all people and businesses for the user.
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        persons: {
          include: { business: true },
          orderBy: { updatedAt: 'desc' }
        },
        businesses: {
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      persons: user.persons,
      businesses: user.businesses,
    });
  } catch (error) {
    console.error("GET /api/network error:", error);
    return NextResponse.json({ error: "Failed to fetch network data" }, { status: 500 });
  }
}

/**
 * POST /api/network
 * Creates a new Person or Business entity.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { type, ...data } = json;
    
    // Convert tags array to JSON string if present
    if (data.tags && Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (type === 'person') {
      const person = await prisma.person.create({
        data: {
          ...data,
          userId: user.id
        },
        include: { business: true }
      });
      return NextResponse.json({ type: 'person', data: person });
    } 
    else if (type === 'business') {
      const business = await prisma.business.create({
        data: {
          ...data,
          userId: user.id
        }
      });
      return NextResponse.json({ type: 'business', data: business });
    }
    
    return NextResponse.json({ error: "Invalid entity type. Use 'person' or 'business'" }, { status: 400 });

  } catch (error) {
    console.error("POST /api/network error:", error);
    return NextResponse.json({ error: "Failed to create entity" }, { status: 500 });
  }
}
