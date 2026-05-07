/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CityPageClient from "./CityPageClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const city = await prisma.city.findUnique({
    where: { id: parseInt(id) },
    include: { country: true },
  });
  if (!city) return { title: "City Not Found" };
  return {
    title: `${city.name}, ${city.country.name} — Local Lens`,
    description: `Discover underrated spots in ${city.name} submitted by locals. Real places, honest rankings.`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cityId = parseInt(id);

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: { country: true },
  });
  if (!city) notFound();

  // Fetch both tabs + stats in parallel
  const [trending, underrated, stats] = await Promise.all([
    prisma.place.findMany({
      where: { cityId, status: { not: "possibly_closed" } },
      orderBy: [{ visitCount: "desc" }, { likeCount: "desc" }],
      take: 20,
      include: {
        submitter: { select: { username: true, avatarUrl: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.place.findMany({
      where: { cityId, visitCount: { gt: 0 }, status: { not: "possibly_closed" } },
      orderBy: { score: "desc" },
      take: 20,
      include: {
        submitter: { select: { username: true, avatarUrl: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.place.groupBy({
      by: ["category"],
      where: { cityId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  const totalPlaces = await prisma.place.count({ where: { cityId } });
  const localCount = await prisma.review.count({
    where: { isLocal: true, place: { cityId } },
  });

  return (
    <CityPageClient
      city={{ id: city.id, name: city.name, country: city.country.name, countryCode: city.country.code }}
      trending={trending as any[]}
      underrated={underrated as any[]}
      categoryStats={stats as any[]}
      totalPlaces={totalPlaces}
      localReviewCount={localCount}
    />
  );
}
