import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/redis";

// POST /api/places/[id]/confirm-open — marks a possibly_closed place as active again
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: placeId } = await params;

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (place.status !== "possibly_closed") {
    return NextResponse.json({ error: "Place is not marked as possibly closed" }, { status: 400 });
  }

  await prisma.place.update({
    where: { id: placeId },
    data: { status: "active", lastActivity: new Date() },
  });

  await invalidateCache(`place:${placeId}`);
  return NextResponse.json({ success: true, status: "active" });
}
