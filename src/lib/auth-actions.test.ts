import { describe, expect, it, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { signUpErrorMessage, resolveSiteUrl } from "@/lib/auth-actions";

const reqWith = (headers: Record<string, string>) =>
  ({ headers: new Headers(headers) } as unknown as NextRequest);

describe("signUpErrorMessage", () => {
  it("signale un email déjà utilisé", () => {
    const msg = signUpErrorMessage({ code: "user_already_exists", message: "User already registered" });
    expect(msg).toContain("compte existe déjà");
  });

  it("signale un mot de passe trop faible", () => {
    const msg = signUpErrorMessage({ code: "weak_password", message: "Password should be at least 8 characters" });
    expect(msg).toContain("mot de passe ne respecte pas");
  });

  it("signale un rate limit d'envoi d'email", () => {
    const msg = signUpErrorMessage({ code: "over_email_send_rate_limit", message: "Email rate limit reached" });
    expect(msg).toContain("Trop de demandes");
  });

  it("signale des inscriptions désactivées", () => {
    const msg = signUpErrorMessage({ code: "signup_disabled", message: "Signups not allowed for this instance" });
    expect(msg).toContain("indisponible");
  });

  it("reste générique pour les erreurs inconnues", () => {
    const msg = signUpErrorMessage({ code: "weird_error", message: "Something odd happened" });
    expect(msg).toBe("Inscription impossible. Vérifiez vos informations ou connectez-vous.");
  });

  it("gère une erreur sans code ni message", () => {
    expect(signUpErrorMessage({})).toBe(
      "Inscription impossible. Vérifiez vos informations ou connectez-vous."
    );
  });
});

describe("resolveSiteUrl (F-01 — anti Host-header poisoning)", () => {
  const savedEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const savedAllowed = process.env.SITE_ALLOWED_HOSTS;
  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = savedEnv;
    process.env.SITE_ALLOWED_HOSTS = savedAllowed;
  });

  it("utilise NEXT_PUBLIC_SITE_URL en priorité, même avec un Host falsifié", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://noli.ci";
    const url = resolveSiteUrl(reqWith({ "x-forwarded-host": "evil.example.com" }));
    expect(url).toBe("https://noli.ci");
  });

  it("accepte un hôte autorisé issu de l'en-tête quand l'env n'est pas fixée", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const url = resolveSiteUrl(reqWith({ "x-forwarded-proto": "https", "x-forwarded-host": "noli.ci" }));
    expect(url).toBe("https://noli.ci");
  });

  it("IGNORE un hôte falsifié non autorisé (pas de poisoning du lien)", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const url = resolveSiteUrl(reqWith({ "x-forwarded-host": "evil.example.com" }));
    expect(url).not.toContain("evil.example.com");
    expect(url).toBe("http://localhost:3000");
  });

  it("autorise un hôte supplémentaire via SITE_ALLOWED_HOSTS", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.SITE_ALLOWED_HOSTS = "staging.noli.ci";
    const url = resolveSiteUrl(reqWith({ "x-forwarded-host": "staging.noli.ci" }));
    expect(url).toBe("https://staging.noli.ci");
  });
});
