import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/importer": ["IMPORTER"],
  "/dashboard/merchant": ["LOCAL_MERCHANT"],
  "/dashboard/supplier": ["SUPPLIER"],
  "/admin": ["ADMIN"],
};

const AUTH_ROUTES = [
  "/orders",
  "/messages",
  "/profile",
  "/listings/new",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Rediriger les utilisateurs connectés hors des pages auth
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Routes nécessitant une connexion
  const needsAuth = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (needsAuth && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Routes par rôle
  for (const [route, requiredRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      const userRoles = (token.roles as string[]) ?? [];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
