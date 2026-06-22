import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type JwtPayload = {
  role?: "stakeholder" | "masyarakat" | "pengepul";
  exp?: number;
};

const ROLE_ROUTES: Record<NonNullable<JwtPayload["role"]>, string[]> = {
  stakeholder: ["/stakeholder"],
  pengepul: ["/pengepul"],
  masyarakat: ["/masyarakat"],
};

const SHARED_AUTH_ROUTES = ["/profile", "/settings"];

function decodeJwtPayload(token: string): JwtPayload {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Invalid token");
  }

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return JSON.parse(atob(padded)) as JwtPayload;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get("cookie_token")?.value ??
    request.cookies.get("access_token")?.value ??
    request.headers.get("x-access-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const decoded = decodeJwtPayload(token);

    if (!decoded.role || !decoded.exp || decoded.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const allowedRoleRoutes = ROLE_ROUTES[decoded.role] ?? [];
    const hasAccess =
      allowedRoleRoutes.some((route) => pathname.startsWith(route)) ||
      SHARED_AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/masyarakat/:path*",
    "/pengepul/:path*",
    "/stakeholder/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
