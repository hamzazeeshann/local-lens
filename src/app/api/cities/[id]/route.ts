import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCached, setCache, CACHE_TTL } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cityId = parseInt(id);
  if (isNaN(cityId)) return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });

  const tab = req.nextUrl.searchParams.get("tab") ?? "trending";
  const category = req.nextUrl.searchParams.get("category") ?? "";

  const cacheKey = `city:${cityId}:${tab}:${category}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const whereBase = {
      cityId,
      status: { not: "possibly_closed" as const },
      ...(category ? { category } : {}),
    };

    let places;
    if (tab === "underrated") {
      places = await prisma.place.findMany({
        where: { ...whereBase, visitCount: { gt: 0 } },
        orderBy: { score: "desc" },
        take: 30,
        include: {
          submitter: { select: { username: true, avatarUrl: true } },
          _count: { select: { reviews: true } },
        },
      });
    } else {
      places = await prisma.place.findMany({
        where: whereBase,
        orderBy: [{ visitCount: "desc" }, { likeCount: "desc" }],
        take: 30,
        include: {
          submitter: { select: { username: true, avatarUrl: true } },
          _count: { select: { reviews: true } },
        },
      });
    }

    await setCache(cacheKey, places, CACHE_TTL.TRENDING);
    return NextResponse.json(places);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
