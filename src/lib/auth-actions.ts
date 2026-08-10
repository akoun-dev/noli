import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reconcileAnonymousQuotes } from "@/lib/quotes-reconcile";
import { registerSchema, loginSchema, emailSchema } from "@/lib/validation";
import { getSessionProfile, getSupabaseServerClient } from "@/lib/auth-guard";
import {
  checkLoginRateLimit,
  checkRegisterRateLimit,
  checkForgotRateLimit,
  checkResetPasswordLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { validatePasswordPolicy } from "@/lib/password-policy";
import { logAudit } from "@/lib/audit";

/**
 * Actions d'authentification partagées entre les routes REST dédiées
 * (POST /api/auth/register, /login, /logout, /forgot, GET /api/auth/me)
 * et l'ancien endpoint unique POST /api/auth (rétro-compatibilité).
 */

const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function rateLimitedResponse(result: { ok: false; retryAfterSec: number }): NextResponse {
  return NextResponse.json(
    {
      error:
        result.retryAfterSec > 3600
          ? "Trop de tentatives. Compte temporairement verrouillé, réessayez plus tard."
          : "Trop de tentatives. Réessayez dans quelques minutes.",
    },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
  );
}

/* ── Inscription ────────────────────────────────────────────────── */

export async function registerAction(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRegisterRateLimit(ip);
  if (!limit.ok) return rateLimitedResponse(limit);

  try {
    const body = await request.json();
    const { email, password, name, phone, role } = body;
    const supabase = await getSupabaseServerClient();

    const parsed = registerSchema.safeParse({
      email,
      name,
      password,
      phone,
      role,
    });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Champs requis manquants";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Politique de complexité configurée (B-01)
    const policy = await validatePasswordPolicy(parsed.data.password);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.message }, { status: 400 });
    }

    const selectedRole = parsed.data.role;
    const parts = parsed.data.name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    // Création du compte Supabase Auth (le profil est créé par le trigger
    // on_auth_user_created à partir de user_metadata).
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email.trim(),
      password: parsed.data.password,
      options: {
        data: {
          role: selectedRole,
          firstName,
          lastName,
          phone: parsed.data.phone || null,
        },
      },
    });

    if (signUpError) {
      // Message générique : ne pas révéler si l'email existe déjà (anti-
      // énumération de comptes), aligné sur le comportement de /login et /forgot.
      return NextResponse.json(
        { error: "Inscription impossible. Vérifiez vos informations ou connectez-vous." },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
    }

    // Choix produit conservé : confirmation email automatique + connexion
    // immédiate pour tous les rôles (y compris USER).
    const { error: confirmError } = await db.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (confirmError) {
      console.warn("[auth] Confirmation email auto impossible:", confirmError.message);
    }

    // Filet de sécurité : le profil est normalement créé par le trigger
    // on_auth_user_created. Si ce trigger est absent ou échoue côté base, on
    // crée le profil ici via la service_role (idempotent). Sans profil, la
    // connexion serait ensuite refusée (« Aucun profil associé à ce compte »).
    const { error: profileEnsureError } = await db
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: parsed.data.email.trim().toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: parsed.data.phone || null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (profileEnsureError) {
      console.warn("[auth] Filet de création de profil impossible:", profileEnsureError.message);
    }

    // Établit la session (cookie httpOnly) : connexion immédiate après l'inscription.
    const { error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email.trim(),
      password: parsed.data.password,
    });
    if (signInAfterSignUpError) {
      console.warn("[auth] Session immédiate impossible:", signInAfterSignUpError.message);
    }

    // NOTE (C-02) : plus de création automatique de compagnie / insurer_accounts
    // à l'inscription. Un assureur doit être activé et lié à une compagnie par
    // un administrateur avant d'accéder à son espace.

    logAudit({
      action: "REGISTER",
      entity: "User",
      entityId: userId,
      details: { email: parsed.data.email.trim(), role: selectedRole },
    });

    // D : rattache les devis anonymes créés avec cet email (best-effort).
    await reconcileAnonymousQuotes(userId, parsed.data.email.trim());

    return NextResponse.json({
      user: {
        id: userId,
        email: parsed.data.email.trim(),
        name: [firstName, lastName].filter(Boolean).join(" "),
        role: selectedRole,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

/* ── Connexion ──────────────────────────────────────────────────── */

export async function loginAction(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json();
    const { email, password } = body;
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Email et mot de passe requis";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    // Anti brute-force par IP + email (C-05)
    const limit = checkLoginRateLimit(ip, normalizedEmail);
    if (!limit.ok) return rateLimitedResponse(limit);

    const supabase = await getSupabaseServerClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: parsed.data.password,
    });

    if (signInError || !authData.user) {
      // Message générique : pas d'énumération d'emails.
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    // Vérifier que le compte est actif
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role, is_active, first_name, last_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[auth] Erreur de lecture du profil:", profileError);
    }

    if (!profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Aucun profil associé à ce compte. Contactez le support." },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Compte désactivé. Contactez le support." }, { status: 403 });
    }

    // D : rattache les devis anonymes créés avec cet email (best-effort).
    await reconcileAnonymousQuotes(authData.user.id, normalizedEmail);

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: normalizedEmail,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

/* ── Déconnexion ────────────────────────────────────────────────── */

export async function logoutAction(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ message: "Déconnecté" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Erreur lors de la déconnexion" }, { status: 500 });
  }
}

/* ── Mot de passe oublié ────────────────────────────────────────── */

export async function forgotAction(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json();
    const { email } = body;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    // Anti-spam email (C-05)
    const limit = checkForgotRateLimit(ip, parsed.data.trim().toLowerCase());
    if (!limit.ok) return rateLimitedResponse(limit);

    const supabase = await getSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.trim(), {
      redirectTo: `${SITE_URL()}/mot-de-passe-oublie`,
    });

    // Réponse identique qu'il existe un compte ou non (pas d'énumération).
    return NextResponse.json({
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

/* ── Réinitialisation du mot de passe (étape 2, via le lien email) ── */

/**
 * Échange le token de récupération contenu dans le lien de l'email
 * (type=recovery) et fixe le nouveau mot de passe.
 *
 * Le token est extrait du hash d'URL par le client puis transmis ici.
 * On établit la session via setSession (le compte n'a pas encore de
 * session active) avant d'appeler updateUser. La session de récupération
 * est ensuite fermée pour forcer une connexion explicite.
 */
export async function resetPasswordAction(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json();
    const { accessToken, refreshToken, password } = body;

    if (!accessToken || !refreshToken || typeof accessToken !== "string" || typeof refreshToken !== "string") {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide ou expiré. Refaites une demande." },
        { status: 400 }
      );
    }

    const limit = checkResetPasswordLimit(ip);
    if (!limit.ok) return rateLimitedResponse(limit);

    const policy = await validatePasswordPolicy(password);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.message }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide ou expiré. Refaites une demande." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      return NextResponse.json({ error: "La réinitialisation a échoué. Réessayez." }, { status: 400 });
    }

    // Ferme la session de récupération : l'utilisateur se reconnectera
    // explicitement avec son nouveau mot de passe.
    await supabase.auth.signOut();

    logAudit({ action: "PASSWORD_RESET", entity: "User" });

    return NextResponse.json({ message: "Votre mot de passe a été réinitialisé." });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

/* ── Session courante ───────────────────────────────────────────── */

export async function meAction() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}
