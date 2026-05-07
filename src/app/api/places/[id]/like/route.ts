import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/redis";

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

  const existing = await prisma.placeLike.findUnique({
    where: { userId_placeId: { userId: session.user.id, placeId } },
  });

  if (existing) {
    // Unlike
    await prisma.placeLike.delete({
      where: { userId_placeId: { userId: session.user.id, placeId } },
    });
    await prisma.place.update({
      where: { id: placeId },
      data: {
        likeCount: { decrement: 1 },
        lastActivity: new Date(),
      },
    });
    // Recompute score
    await prisma.$executeRaw`
      UPDATE places
      SET score = CASE WHEN visit_count = 0 THEN 0
                       ELSE ROUND(like_count::DECIMAL / visit_count, 6) END
      WHERE id = ${placeId}::uuid
    `;
    await invalidateCache(`place:${placeId}`, `trending:${place.cityId}`, `underrated:${place.cityId}`);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await prisma.placeLike.create({
      data: { userId: session.user.id, placeId },
    });
    await prisma.place.update({
      where: { id: placeId },
      data: {
        likeCount: { increment: 1 },
        lastActivity: new Date(),
      },
    });
    await prisma.$executeRaw`
      UPDATE places
      SET score = CASE WHEN visit_count = 0 THEN 0
                       ELSE ROUND(like_count::DECIMAL / visit_count, 6) END
      WHERE id = ${placeId}::uuid
    `;
    await invalidateCache(`place:${placeId}`, `trending:${place.cityId}`, `underrated:${place.cityId}`);
    return NextResponse.json({ liked: true });
  }
}
