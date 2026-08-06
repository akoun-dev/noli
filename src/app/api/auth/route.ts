import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { registerSchema, loginSchema, emailSchema } from "@/lib/validation";
import { getSessionProfile, getSupabaseServerClient } from "@/lib/auth-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Limites par action sensible (fenêtre glissante de 15 minutes, par IP).
const RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  register: { limit: 5, windowSeconds: 15 * 60 },
  forgot: { limit: 5, windowSeconds: 15 * 60 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name, phone, role, companyName, companyEmail, companyPhone, companyWebsite } = body;

    const rateLimitConfig = RATE_LIMITS[action as string];
    if (rateLimitConfig) {
      const ip = getClientIp(request);
      const { allowed, retryAfterSeconds } = checkRateLimit(
        `auth:${action}:${ip}`,
        rateLimitConfig.limit,
        rateLimitConfig.windowSeconds
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "Trop de tentatives. Réessayez dans quelques minutes." },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
      }
    }

    const supabase = await getSupabaseServerClient();

    if (action === "register") {
      const parsed = registerSchema.safeParse({ email, name, password, phone, role, companyName, companyEmail, companyPhone, companyWebsite });
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Champs requis manquants";
        return NextResponse.json({ error: firstError }, { status: 400 });
      }

      const selectedRole = parsed.data.role;
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      // Création du compte Supabase Auth (le profil est créé automatiquement
      // par le trigger on_auth_user_created à partir de user_metadata).
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: selectedRole,
            firstName,
            lastName,
            phone: phone || null,
          },
        },
      });

      if (signUpError) {
        const message = signUpError.message?.toLowerCase().includes("registered")
          ? "Cet email est déjà utilisé"
          : signUpError.message;
        const status = signUpError.message?.toLowerCase().includes("registered") ? 409 : 400;
        return NextResponse.json({ error: message }, { status });
      }

      const userId = authData.user?.id;
      if (!userId) {
        return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
      }

      // L'app n'exige pas de vérification d'email (comportement de l'ancien
      // flux Prisma) : confirmation automatique via la clé service_role.
      const { error: confirmError } = await db.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (confirmError) {
        console.warn("[auth] Confirmation email auto impossible:", confirmError.message);
      }

      // Établit la session (cookie httpOnly) : connexion immédiate après
      // l'inscription, comme attendu par le front.
      const { error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInAfterSignUpError) {
        console.warn("[auth] Session immédiate impossible:", signInAfterSignUpError.message);
      }

      // Si INSURER, créer la compagnie + la liaison automatiquement
      if (selectedRole === "INSURER" && companyName?.trim()) {
        const code = companyName
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 20);

        const { data: insurer, error: insurerError } = await db
          .from("insurers")
          .insert({
            code,
            name: companyName.trim(),
            contact_email: companyEmail?.trim() || email,
            phone: companyPhone?.trim() || phone,
            website: companyWebsite?.trim() || null,
          })
          .select()
          .single();

        if (!insurerError && insurer) {
          await db.from("insurer_accounts").insert({
            profile_id: userId,
            insurer_id: insurer.id,
          });
        }
      }

      return NextResponse.json({
        user: {
          id: userId,
          email: email.trim(),
          name: [firstName, lastName].filter(Boolean).join(" "),
          role: selectedRole,
        },
      });
    }

    if (action === "login") {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Email et mot de passe requis";
        return NextResponse.json({ error: firstError }, { status: 400 });
      }

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !authData.user) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }

      // Vérifier que le compte est actif
      const { data: profile } = await db
        .from("profiles")
        .select("role, is_active, first_name, last_name")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        return NextResponse.json({ error: "Compte désactivé. Contactez le support." }, { status: 403 });
      }

      return NextResponse.json({
        user: {
          id: authData.user.id,
          email: email.trim(),
          name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
          role: profile.role,
        },
      });
    }

    if (action === "logout") {
      await supabase.auth.signOut();
      return NextResponse.json({ message: "Déconnecté" });
    }

    if (action === "forgot") {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
      }
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/forgot`,
      });
      return NextResponse.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
    }

    if (action === "me") {
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
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}
