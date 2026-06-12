// Converts a Prisma Decimal (or any object with toNumber()) to a plain JS number
function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}

/** Convert Prisma Decimal fields to plain numbers so they can cross RSC→Client boundary */
export function serializePlace(p: Record<string, unknown>): Record<string, unknown> {
  return {
    ...p,
    latitude: toNum(p.latitude),
    longitude: toNum(p.longitude),
    score: toNum(p.score),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    lastActivity: p.lastActivity instanceof Date ? p.lastActivity.toISOString() : p.lastActivity,
  };
}

export function serializePlaces(places: Record<string, unknown>[]): Record<string, unknown>[] {
  return places.map(serializePlace);
}
