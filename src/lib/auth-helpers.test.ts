import { describe, it, expect } from "vitest";
import { signUpErrorMessage } from "@/lib/auth-actions";
import { getInitials, parseFCFA, formatFCFA } from "@/lib/utils";
import { isTimeoutError, networkErrorMessage } from "@/lib/fetch-with-timeout";

/*
 * Couverture de fonctions utilitaires pures (auth, formatage, réseau).
 * Ces helpers pilotent des messages/valeurs vus par l'utilisateur — on fige
 * leur comportement pour éviter les régressions silencieuses.
 */

describe("signUpErrorMessage", () => {
  it("détecte un email déjà existant", () => {
    expect(signUpErrorMessage({ code: "user_already_exists" })).toContain("existe déjà");
    expect(signUpErrorMessage({ message: "User already registered" })).toContain("existe déjà");
  });

  it("détecte un mot de passe faible", () => {
    expect(signUpErrorMessage({ code: "weak_password" })).toContain("exigences de sécurité");
  });

  it("détecte un rate limit", () => {
    expect(signUpErrorMessage({ code: "over_email_send_rate_limit" })).toContain("Trop de demandes");
  });

  it("retombe sur un message générique sinon", () => {
    expect(signUpErrorMessage({ code: "unknown", message: "boom" })).toContain("Inscription impossible");
    expect(signUpErrorMessage({})).toContain("Inscription impossible");
  });
});

describe("getInitials", () => {
  it("combine prénom et nom", () => {
    expect(getInitials("Jean", "Dupont")).toBe("JD");
  });
  it("gère un nom composé fourni dans le prénom", () => {
    expect(getInitials("Jean Marc Dupont")).toBe("JD");
  });
  it("prend les deux premières lettres d'un prénom simple", () => {
    expect(getInitials("Awa")).toBe("AW");
  });
  it("renvoie « ? » sans donnée", () => {
    expect(getInitials()).toBe("?");
  });
});

describe("parseFCFA / formatFCFA", () => {
  it("parse un montant avec espaces et virgules", () => {
    expect(parseFCFA("18 000 000")).toBe(18000000);
    expect(parseFCFA("5,500")).toBe(5500);
    expect(parseFCFA("")).toBe(0);
    expect(parseFCFA(null)).toBe(0);
  });
  it("formate un montant ou renvoie un tiret", () => {
    expect(formatFCFA(5500)).toContain("FCFA");
    expect(formatFCFA(null)).toBe("—");
  });
});

describe("isTimeoutError / networkErrorMessage", () => {
  it("reconnaît un TimeoutError", () => {
    const err = new DOMException("expiré", "TimeoutError");
    expect(isTimeoutError(err)).toBe(true);
    expect(networkErrorMessage(err)).toContain("trop de temps");
  });
  it("traduit un échec de connexion (TypeError)", () => {
    expect(networkErrorMessage(new TypeError("failed to fetch"))).toContain("Impossible de contacter");
  });
  it("reprend le message d'une Error standard, sinon générique", () => {
    expect(networkErrorMessage(new Error("détail"))).toBe("détail");
    expect(networkErrorMessage("x")).toContain("Une erreur est survenue");
  });
});
