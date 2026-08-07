import { NextRequest, NextResponse } from "next/server";

/**
 * Protection CSRF : vérifie l'en-tête Origin sur les méthodes mutantes
 * des routes /api/*.
 *
 * - Même origine (ou en-tête absent = client non-navigateur) → autorisé.
 * - Origine différente du Host → 403.
 *
 * Complète la protection offerte par les cookies SameSite=Lax.
 */

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const method = request.method.toUpperCase();
  if (!UNSAFE_METHODS.has(method)) return NextResponse.next();

  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.next();

  const host = request.headers.get("host") || "";
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    // Origin malformé → on laisse passer, le garde applicatif reste en place.
    return NextResponse.next();
  }

  if (originHost === host) return NextResponse.next();

  return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
}

export const config = {
  matcher: "/api/:path*",
};
