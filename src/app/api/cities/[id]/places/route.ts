import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCached, setCache, invalidateCache, CACHE_TTL } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tab = req.nextUrl.searchParams.get("tab") || "trending";
  const cacheKey = `${tab}:${id}`;

  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  const orderBy =
    tab === "underrated"
      ? [{ score: "desc" as const }]
      : [{ visitCount: "desc" as const }, { likeCount: "desc" as const }];

  const places = await prisma.place.findMany({
    where: { cityId: parseInt(id), status: { not: "possibly_closed" } },
    orderBy,
    take: 20,
    include: {
      city: { include: { country: true } },
      submitter: { select: { username: true, avatarUrl: true } },
      _count: { select: { reviews: true } },
    },
  });

  const ttl = tab === "trending" ? CACHE_TTL.TRENDING : CACHE_TTL.UNDERRATED;
  await setCache(cacheKey, places, ttl);
  return NextResponse.json(places);
}
