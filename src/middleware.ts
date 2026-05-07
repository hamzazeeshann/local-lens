import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple JWT-based session check for Edge runtime
// NextAuth sets a session cookie - we just check its existence here
// and let the page-level auth() handle the real verification
const PROTECTED = ["/submit", "/profile/me"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check for NextAuth session cookie (works on Edge runtime)
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

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
