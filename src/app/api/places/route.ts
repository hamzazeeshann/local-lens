import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const placeSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  category: z.enum(["cafe", "viewpoint", "market", "restaurant", "park", "shop", "museum", "beach", "street", "other"]),
  cityId: z.number(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photoUrls: z.array(z.string().url()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "active";
  const places = await prisma.place.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      city: { include: { country: true } },
      submitter: { select: { username: true, avatarUrl: true } },
    },
  });
  return NextResponse.json(places);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = placeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, category, cityId, latitude, longitude, photoUrls } = parsed.data;

  const place = await prisma.place.create({
    data: {
      name,
      description,
      category,
      cityId,
      submittedBy: session.user.id,
      latitude,
      longitude,
      photoUrls,
    },
    include: {
      city: { include: { country: true } },
      submitter: { select: { username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(place, { status: 201 });
}
