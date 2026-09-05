import { NextResponse } from "next/server";
import { getSessionProfile as getLocalSessionProfile } from "@/lib/local-auth";

export type AllowedRole = "ADMIN" | "INSURER" | "USER";
export interface SessionProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function unauthorized(message = "Non autorisé") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Accès refusé") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getSessionProfile() {
  return getLocalSessionProfile();
}

export async function requireAuth(allowedRoles?: AllowedRole[]) {
  const profile = await getSessionProfile();
  if (!profile) return unauthorized("Authentification requise");
  if (allowedRoles && !allowedRoles.includes(profile.role as AllowedRole)) return forbidden("Accès refusé");
  return null;
}

export function requireAdmin(profile: SessionProfile | null) {
  if (!profile) return unauthorized("Authentification requise");
  if (profile.role !== "ADMIN") return forbidden("Accès réservé aux administrateurs");
  return null;
}

export function requireRole(profile: SessionProfile | null, roles: AllowedRole[]) {
  if (!profile) return unauthorized("Authentification requise");
  if (!roles.includes(profile.role as AllowedRole)) return forbidden("Accès refusé");
  return null;
}

export interface InsurerAccount {
  id: string;
  insurerId: string;
}

export async function getInsurerAccount(profileId: string): Promise<InsurerAccount | null> {
  const { data, error } = await (await import("@/lib/db")).db
    .from("insurer_accounts")
    .select("id, insurer_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return { id: String(row.id), insurerId: String(row.insurer_id) };
}
