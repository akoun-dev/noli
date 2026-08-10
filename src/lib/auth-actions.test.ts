import { describe, expect, it } from "vitest";
import { signUpErrorMessage } from "@/lib/auth-actions";

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
