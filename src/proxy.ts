import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-compatible auth check — reads NextAuth session cookie
const PROTECTED = ["/submit", "/profile/me"];

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const sessionToken =
  req.cookies.get("__Secure-authjs.session-token")?.value ||
  req.cookies.get("authjs.session-token")?.value;

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/submit", "/profile/me/:path*"],
};
