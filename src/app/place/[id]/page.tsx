/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { serializePlace, serializePlaces } from "@/lib/serialize";
import PlaceDetailClient from "./PlaceDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const place = await prisma.place.findUnique({
    where: { id },
    include: { city: { include: { country: true } } },
  });
  if (!place) return { title: "Place Not Found" };
  return {
    title: `${place.name} — Local Lens`,
    description: place.description.slice(0, 155),
  };
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      city: { include: { country: true } },
      submitter: { select: { id: true, username: true, avatarUrl: true, cityId: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: { select: { username: true, avatarUrl: true, cityId: true } },
        },
      },
      _count: { select: { likes: true, visits: true, reviews: true } },
    },
  });

  if (!place) notFound();

  const nearby = await prisma.place.findMany({
    where: { cityId: place.cityId, id: { not: id } },
    orderBy: { score: "desc" },
    take: 4,
    include: {
      city: { include: { country: true } },
      submitter: { select: { username: true } },
    },
  });

  // Serialize reviews dates too
  const serializedPlace = {
    ...serializePlace(place as any),
    reviews: (place.reviews as any[]).map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
  };

  return (
    <PlaceDetailClient
      place={serializedPlace as any}
      nearby={serializePlaces(nearby as any[])}
    />
  );
}
