import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/places/viral — places flagged as viral by cron job
export async function GET() {
  try {
    const viral = await prisma.place.findMany({
      where: { status: "viral" },
      orderBy: { visitCount: "desc" },
      take: 10,
      include: {
        city: { include: { country: true } },
        submitter: { select: { username: true, avatarUrl: true } },
      },
    });
    return NextResponse.json(viral);
  } catch {
    return NextResponse.json([]);
  }
}
