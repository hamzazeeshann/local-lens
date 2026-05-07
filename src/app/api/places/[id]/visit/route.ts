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

  await prisma.placeVisit.create({ data: { placeId, visitorId } });

  // Increment visit count + recompute score
  await prisma.$executeRaw`
    UPDATE places
    SET visit_count = visit_count + 1,
        score = CASE WHEN (visit_count + 1) = 0 THEN 0
                     ELSE ROUND(like_count::DECIMAL / (visit_count + 1), 6) END,
        last_activity = now()
    WHERE id = ${placeId}::uuid
  `;

  await invalidateCache(`place:${placeId}`, `trending:${place.cityId}`);
  return NextResponse.json({ success: true });
}
