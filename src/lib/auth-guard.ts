import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, mapRow } from '@/lib/db';

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

// Client Supabase serveur (SSR) lié à la session de l'utilisateur (cookie).
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !url.startsWith("http") || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_ANON_KEY non configurés dans .env"
    );
  }
  const cookieStore = await cookies();
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Appelé depuis un Server Component → cookie en lecture seule
          }
        },
      },
    }
  );
}

// Récupère le profil de l'utilisateur connecté (ou null).
// La session est le JWT Supabase (cookie), pas une table "sessions".
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return mapRow<SessionProfile>(data);
}

export async function requireAuth(allowedRoles?: AllowedRole[]) {
  const profile = await getSessionProfile();
  if (!profile) return unauthorized("Authentification requise");

  if (allowedRoles && !allowedRoles.includes(profile.role as AllowedRole)) {
    return forbidden("Accès refusé");
  }

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

// Récupère le compte assureur lié au profil (via insurer_accounts).
// L'identité vient TOUJOURS de la session, jamais du client.
export async function getInsurerAccount(profileId: string): Promise<InsurerAccount | null> {
  const { data } = await db
    .from("insurer_accounts")
    .select("id, insurer_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return mapRow<InsurerAccount>(data);
}
