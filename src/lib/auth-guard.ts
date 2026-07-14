import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type AllowedRole = "ADMIN" | "INSURER" | "USER";

const SESSION_COOKIE = "noli_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function unauthorized(message = "Non autorisé") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Accès refusé") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getSessionProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { profile: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session.profile;
}

export async function createSession(profileId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: { token, profileId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(allowedRoles?: AllowedRole[]) {
  const profile = await getSessionProfile();
  if (!profile) return unauthorized("Authentification requise");

  if (allowedRoles && !allowedRoles.includes(profile.role as AllowedRole)) {
    return forbidden("Accès refusé");
  }

  return null;
}

export function requireAdmin(profile: { role?: string } | null) {
  if (!profile) return unauthorized("Authentification requise");
  if (profile.role !== "ADMIN") return forbidden("Accès réservé aux administrateurs");
  return null;
}

export function requireRole(profile: { role?: string } | null, roles: AllowedRole[]) {
  if (!profile) return unauthorized("Authentification requise");
  if (!roles.includes(profile.role as AllowedRole)) return forbidden("Accès refusé");
  return null;
}
