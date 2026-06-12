import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/redis";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: placeId } = await params;
  const session = await auth();
  const visitorId = session?.user?.id ?? null;

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Record the visit
  await prisma.placeVisit.create({ data: { placeId, visitorId } });

  // Increment visitCount via ORM (no raw SQL / no UUID cast issues)
  const updated = await prisma.place.update({
    where: { id: placeId },
    data: {
      visitCount: { increment: 1 },
      lastActivity: new Date(),
    },
    select: { likeCount: true, visitCount: true },
  });

  // Recompute score via ORM
  const newScore = updated.visitCount > 0
    ? updated.likeCount / updated.visitCount
    : 0;

  await prisma.place.update({
    where: { id: placeId },
    data: { score: newScore },
  });

  await invalidateCache(`place:${placeId}`, `trending:${place.cityId}`);
  return NextResponse.json({ success: true });
}
