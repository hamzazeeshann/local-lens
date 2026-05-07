import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/redis";
import { z } from "zod";

const reviewSchema = z.object({
  content: z.string().min(10).max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: placeId } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Check if user already reviewed
  const existing = await prisma.review.findUnique({
    where: { placeId_userId: { placeId, userId: session.user.id } },
  });
  if (existing)
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  // Determine if reviewer is a local
  const [user, place] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.place.findUnique({ where: { id: placeId } }),
  ]);
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isLocal = !!user?.cityId && user.cityId === place.cityId;

  const review = await prisma.review.create({
    data: {
      placeId,
      userId: session.user.id,
      content: parsed.data.content,
      isLocal,
    },
    include: {
      user: { select: { username: true, avatarUrl: true } },
    },
  });

  // Update lastActivity
  await prisma.place.update({
    where: { id: placeId },
    data: { lastActivity: new Date() },
  });

  await invalidateCache(`place:${placeId}`);
  return NextResponse.json(review, { status: 201 });
}
