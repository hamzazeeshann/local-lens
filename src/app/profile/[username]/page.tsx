/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import { serializePlace, serializePlaces } from "@/lib/serialize";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { title: "User Not Found" };
  return {
    title: `@${user.username} — Local Lens`,
    description: user.bio || `Check out ${user.username}'s discoveries on Local Lens.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { city: { include: { country: true } } },
  });
  if (!user) notFound();

  const [submissions, likedPlaces, reviews, stats] = await Promise.all([
    // User's submitted places
    prisma.place.findMany({
      where: { submittedBy: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        city: { include: { country: true } },
        submitter: { select: { username: true, avatarUrl: true } },
        _count: { select: { reviews: true } },
      },
    }),
    // Liked places (Visit Again)
    prisma.placeLike.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        place: {
          include: {
            city: { include: { country: true } },
            submitter: { select: { username: true, avatarUrl: true } },
          },
        },
      },
    }),
    // Recent reviews
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        place: { include: { city: { include: { country: true } } } },
      },
    }),
    // City stats
    prisma.place.groupBy({
      by: ["cityId"],
      where: { submittedBy: user.id },
      _count: { id: true },
    }),
  ]);

  const citiesCount = stats.length;
  const totalLikes = submissions.reduce((acc: number, p: any) => acc + p.likeCount, 0);

  const serializedSubmissions = serializePlaces(submissions as any[]);
  const serializedLikedPlaces = likedPlaces.map((l: any) => serializePlace(l.place as any));
  const serializedReviews = reviews.map((r: any) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    place: serializePlace(r.place as any),
  }));

  return (
    <ProfilePageClient
      user={{
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
        city: user.city ? { name: user.city.name, country: user.city.country.name } : null,
      }}
      submissions={serializedSubmissions as any[]}
      likedPlaces={serializedLikedPlaces as any[]}
      reviews={serializedReviews as any[]}
      stats={{ submissions: submissions.length, likes: totalLikes, reviews: reviews.length, cities: citiesCount }}
    />
  );
}
