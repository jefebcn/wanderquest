import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — gate Pro-only API routes.
 *
 * Full token verification (Firebase Admin) happens inside each route handler.
 * This middleware performs a lightweight presence-check on the Authorization
 * header so unauthenticated requests get a 401 before touching the handler.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pro-only API routes
  const protectedPaths = ["/api/elite-quests", "/api/chat"];

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Autenticazione richiesta." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/elite-quests/:path*", "/api/chat/:path*"],
};
