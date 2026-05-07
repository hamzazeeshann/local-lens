import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCached, setCache, CACHE_TTL } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const cacheKey = `city:search:${q.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Raw SQL for full-text search
  const results = await prisma.$queryRaw<
    Array<{ id: number; name: string; country_name: string; country_code: string }>
  >`
    SELECT c.id, c.name, co.name AS country_name, co.code AS country_code
    FROM cities c
    JOIN countries co ON co.id = c.country_id
    WHERE c.search_vec @@ plainto_tsquery('english', ${q})
       OR c.name ILIKE ${`%${q}%`}
    ORDER BY ts_rank(c.search_vec, plainto_tsquery('english', ${q})) DESC
    LIMIT 10
  `;

  const formatted = results.map((r: { id: number; name: string; country_name: string; country_code: string }) => ({
    id: r.id,
    name: r.name,
    country: r.country_name,
    code: r.country_code,
  }));

  await setCache(cacheKey, formatted, CACHE_TTL.CITY_SEARCH);
  return NextResponse.json(formatted);
}
