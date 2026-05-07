import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCached, setCache, invalidateCache, CACHE_TTL } from "@/lib/redis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `place:${id}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      city: { include: { country: true } },
      submitter: { select: { id: true, username: true, avatarUrl: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { username: true, avatarUrl: true, cityId: true } } },
      },
      _count: { select: { likes: true, visits: true, reviews: true } },
    },
  });

  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await setCache(cacheKey, place, CACHE_TTL.PLACE_DETAIL);
  return NextResponse.json(place);
}
