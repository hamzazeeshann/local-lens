import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, avatarUrl: true,
        bio: true, createdAt: true,
        city: { select: { name: true, country: { select: { name: true } } } },
        _count: { select: { places: true, reviews: true, likes: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.id !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { bio, cityId } = body;

  const updated = await prisma.user.update({
    where: { username },
    data: {
      bio: bio ?? undefined,
      cityId: cityId ?? undefined,
    },
    select: { id: true, username: true, bio: true, cityId: true },
  });
  return NextResponse.json(updated);
}
