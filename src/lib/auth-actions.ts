import { NextRequest, NextResponse } from "next/server";
import { emailSchema, loginSchema, registerSchema } from "@/lib/validation";
import { getSessionProfile } from "@/lib/auth-guard";
import { createLocalUser, authenticateUser, createSession, destroySession, createPasswordResetToken, resetPassword } from "@/lib/local-auth";
import { checkForgotRateLimit, checkLoginRateLimit, checkRegisterRateLimit, checkResetPasswordLimit, getClientIp } from "@/lib/rate-limit";
import { validatePasswordPolicy } from "@/lib/password-policy";
import { logAudit } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";

export function signUpErrorMessage(err: { code?: string; message?: string }): string {
  const code = (err.code || "").toLowerCase();
  const message = (err.message || "").toLowerCase();
  if (code.includes("already_exists") || message.includes("already registered") || message.includes("already been registered")) {
    return "Un compte existe déjà avec cette adresse email. Connectez-vous ou réinitialisez votre mot de passe.";
  }
  if (code.includes("weak_password") || message.includes("password should") || message.includes("at least")) {
    return "Le mot de passe ne respecte pas les exigences de sécurité. Utilisez au moins 8 caractères, une majuscule et un chiffre.";
  }
  if (code.includes("rate_limit") || message.includes("rate limit") || message.includes("too fast")) {
    return "Trop de demandes. Attendez quelques minutes avant de réessayer.";
  }
  if (code.includes("signup_disabled") || message.includes("signup") || message.includes("not allowed") || code.includes("provider_disabled")) {
    return "L'inscription est momentanément indisponible. Réessayez plus tard ou contactez le support.";
  }
  return "Inscription impossible. Vérifiez vos informations ou connectez-vous.";
}

function rateLimitedResponse(result: { ok: false; retryAfterSec: number }) {
  return NextResponse.json(
    { error: result.retryAfterSec > 3600 ? "Trop de tentatives. Compte temporairement verrouillé, réessayez plus tard." : "Trop de tentatives. Réessayez dans quelques minutes." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
  );
}

function resolveSiteUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host")?.trim();
  return host ? `${proto}://${host}` : configured || "http://localhost:3000";
}

export async function registerAction(request: NextRequest) {
  const limit = checkRegisterRateLimit(getClientIp(request));
  if (!limit.ok) return rateLimitedResponse(limit);
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Champs requis manquants" }, { status: 400 });
    const policy = await validatePasswordPolicy(parsed.data.password);
    if (!policy.ok) return NextResponse.json({ error: policy.message }, { status: 400 });
    const parts = parsed.data.name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    const user = await createLocalUser({ email: parsed.data.email, password: parsed.data.password, firstName, lastName, phone: parsed.data.phone });
    await createSession(user.id);
    await logAudit({ action: "REGISTER", entity: "User", entityId: user.id, details: { email: user.email } });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: [firstName, lastName].filter(Boolean).join(" "), role: "USER" } });
  } catch (error: unknown) {
    const code = error instanceof Error && "code" in error ? String((error as Error & { code?: string }).code) : "";
    if (code === "23505") return NextResponse.json({ error: signUpErrorMessage({ code: "already_exists" }) }, { status: 400 });
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

export async function loginAction(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Email et mot de passe requis" }, { status: 400 });
    const limit = checkLoginRateLimit(getClientIp(request), parsed.data.email.trim().toLowerCase());
    if (!limit.ok) return rateLimitedResponse(limit);
    const result = await authenticateUser(parsed.data.email.trim().toLowerCase(), parsed.data.password);
    if (!result) return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    await createSession(result.user.id);
    return NextResponse.json({ user: { id: result.user.id, email: result.user.email, name: [result.profile.firstName, result.profile.lastName].filter(Boolean).join(" "), role: result.profile.role } });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

export async function logoutAction(_request?: NextRequest) {
  try {
    await destroySession();
    return NextResponse.json({ message: "Déconnecté" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Erreur lors de la déconnexion" }, { status: 500 });
  }
}

export async function forgotAction(request: NextRequest) {
  const parsed = emailSchema.safeParse((await request.json().catch(() => null))?.email);
  if (!parsed.success) return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  const email = parsed.data.trim().toLowerCase();
  const limit = checkForgotRateLimit(getClientIp(request), email);
  if (!limit.ok) return rateLimitedResponse(limit);
  try {
    const token = await createPasswordResetToken(email);
    if (token) await sendPasswordResetEmail(email, `${resolveSiteUrl(request)}/mot-de-passe-oublie?token=${encodeURIComponent(token)}`);
    return NextResponse.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

export async function resetPasswordAction(request: NextRequest) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => null);
  const token = body?.token || body?.accessToken;
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Lien de réinitialisation invalide ou expiré. Refaites une demande." }, { status: 400 });
  const limit = checkResetPasswordLimit(ip);
  if (!limit.ok) return rateLimitedResponse(limit);
  const policy = await validatePasswordPolicy(body?.password);
  if (!policy.ok) return NextResponse.json({ error: policy.message }, { status: 400 });
  try {
    const success = await resetPassword(token, body.password);
    if (!success) return NextResponse.json({ error: "Lien de réinitialisation invalide ou expiré. Refaites une demande." }, { status: 400 });
    await logAudit({ action: "PASSWORD_RESET", entity: "User" });
    return NextResponse.json({ message: "Votre mot de passe a été réinitialisé." });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}

export async function meAction() {
  try {
    const profile = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ user: { id: profile.id, email: profile.email, name: [profile.firstName, profile.lastName].filter(Boolean).join(" "), role: profile.role } });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}
