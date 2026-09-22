import { describe, expect, it } from "vitest";
import {
  emailSchema,
  passwordSchema,
  personalInfoSchema,
  vehicleInfoSchema,
  coverageNeedsSchema,
  compareRequestSchema,
  registerSchema,
  loginSchema,
  createOfferSchema,
  updateUserSchema,
  createQuoteSchema,
  contactMessageSchema,
  requestCallbackSchema,
} from "./validation";

describe("emailSchema", () => {
  it("accepte une adresse valide", () => {
    expect(emailSchema.safeParse("jean.dupont@example.com").success).toBe(true);
  });

  it("rejette une adresse invalide avec le message français", () => {
    const result = emailSchema.safeParse("pas-un-email");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Adresse email invalide");
    }
  });
});

describe("passwordSchema", () => {
  it("accepte un mot de passe conforme à la politique (8+, maj, min, chiffre)", () => {
    expect(passwordSchema.safeParse("Secret123").success).toBe(true);
  });

  it("rejette un mot de passe trop court", () => {
    const result = passwordSchema.safeParse("Ab1c5");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8 caractères");
    }
  });

  it("rejette un mot de passe sans majuscule / minuscule / chiffre", () => {
    expect(passwordSchema.safeParse("motdepasse").success).toBe(false); // pas de maj ni chiffre
    expect(passwordSchema.safeParse("MOTDEPASSE1").success).toBe(false); // pas de minuscule
    expect(passwordSchema.safeParse("Motdepasse").success).toBe(false); // pas de chiffre
  });
});

describe("personalInfoSchema", () => {
  const valid = {
    lastName: "Dupont",
    firstName: "Jean",
    email: "jean@example.com",
    phone: "+2250700000000",
  };

  it("accepte des informations complètes", () => {
    expect(personalInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("accepte whatsappOptIn optionnel", () => {
    expect(
      personalInfoSchema.safeParse({ ...valid, whatsappOptIn: false }).success
    ).toBe(true);
  });

  it("rejette si le nom manque", () => {
    const result = personalInfoSchema.safeParse({ ...valid, lastName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le nom est requis");
    }
  });
});

describe("vehicleInfoSchema", () => {
  const valid = {
    fuelType: "essence",
    fiscalPower: "6",
    seats: "4",
    year: "2020",
    newValue: "18000000",
    currentValue: "10000000",
    usage: "personnel",
  };

  it("accepte un véhicule complet", () => {
    expect(vehicleInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette si un champ requis manque", () => {
    const result = vehicleInfoSchema.safeParse({ ...valid, newValue: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Requis");
    }
  });
});

describe("coverageNeedsSchema", () => {
  it("applique la durée par défaut de 12 mois", () => {
    const parsed = coverageNeedsSchema.parse({ contractType: "all_risks" });
    expect(parsed.contractDuration).toBe(12);
  });

  it("rejette un type de contrat vide", () => {
    const result = coverageNeedsSchema.safeParse({ contractType: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sélectionnez un type de contrat");
    }
  });

  it("rejette une durée hors bornes 1-12", () => {
    expect(coverageNeedsSchema.safeParse({ contractType: "basic", contractDuration: 13 }).success).toBe(false);
    expect(coverageNeedsSchema.safeParse({ contractType: "basic", contractDuration: 0 }).success).toBe(false);
    expect(coverageNeedsSchema.safeParse({ contractType: "basic", contractDuration: 6 }).success).toBe(true);
  });
});

describe("compareRequestSchema", () => {
  const valid = {
    personalInfo: {
      lastName: "Dupont",
      firstName: "Jean",
      email: "jean@example.com",
      phone: "+2250700000000",
    },
    vehicleInfo: {
      fuelType: "essence",
      fiscalPower: "6",
      seats: "4",
      year: "2020",
      newValue: "18000000",
      currentValue: "10000000",
      usage: "personnel",
    },
    coverageNeeds: { contractType: "all_risks" },
  };

  it("accepte une requête de comparaison complète", () => {
    expect(compareRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette une requête avec un sous-objet invalide", () => {
    const result = compareRequestSchema.safeParse({
      ...valid,
      coverageNeeds: { contractType: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("coverageNeeds"))).toBe(true);
    }
  });
});

describe("registerSchema", () => {
  it("accepte un enregistrement minimal et applique le rôle USER par défaut", () => {
    const parsed = registerSchema.parse({
      email: "jean@example.com",
      name: "Jean Dupont",
      password: "Secret123",
      phone: "+2250700000000",
    });
    expect(parsed.role).toBe("USER");
  });

  it("accepte un rôle ASSUREUR avec les champs entreprise", () => {
    expect(
      registerSchema.safeParse({
        email: "a@example.com",
        name: "Compagnie",
        password: "Secret123",
        role: "INSURER",
        companyName: "Assureur CI",
      }).success
    ).toBe(true);
  });

  it("rejette un rôle inconnu", () => {
    const result = registerSchema.safeParse({
      email: "a@example.com",
      name: "X",
      password: "Secret123",
      role: "SUPERADMIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepte des identifiants valides", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
  });

  it("rejette un mot de passe vide", () => {
    const result = loginSchema.safeParse({ email: "a@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le mot de passe est requis");
    }
  });
});

describe("createOfferSchema", () => {
  it("accepte une offre valide avec champs optionnels", () => {
    expect(
      createOfferSchema.safeParse({
        insurerId: "ins-1",
        name: "Tous Risques",
        coverageType: "all_risks",
        basePrice: 100000,
        deductible: 250000,
        features: ["Assistance"],
      }).success
    ).toBe(true);
  });

  it("rejette un prix négatif", () => {
    const result = createOfferSchema.safeParse({
      insurerId: "ins-1",
      name: "X",
      coverageType: "basic",
      basePrice: -5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le prix doit être positif");
    }
  });
});

describe("updateUserSchema", () => {
  it("accepte une mise à jour partielle", () => {
    expect(updateUserSchema.safeParse({ id: "u1", name: "Nouveau nom" }).success).toBe(true);
  });

  it("rejette une mise à jour sans id", () => {
    expect(updateUserSchema.safeParse({ name: "X" }).success).toBe(false);
  });
});

describe("createQuoteSchema (F-02)", () => {
  const validBody = {
    personalInfo: { lastName: "Doe", firstName: "John", email: "john@doe.ci", phone: "0700000000" },
    vehicleInfo: {
      fuelType: "Essence", fiscalPower: "7", seats: "5", year: "2020",
      newValue: "15000000", currentValue: "10000000", usage: "Personnel",
    },
    coverageNeeds: { contractType: "all_risks", contractDuration: 12 },
    offer: { insurerName: "SandyAssur", name: "Tous Risques", monthlyPrice: 25000, annualPrice: 300000 },
  };

  it("accepte un corps de devis complet", () => {
    expect(createQuoteSchema.safeParse(validBody).success).toBe(true);
  });

  it("rejette une offre sans assureur (insurerName)", () => {
    const bad = { ...validBody, offer: { name: "X" } };
    expect(createQuoteSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un email invalide", () => {
    const bad = { ...validBody, personalInfo: { ...validBody.personalInfo, email: "pas-un-email" } };
    expect(createQuoteSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un prix négatif ou hors bornes", () => {
    expect(createQuoteSchema.safeParse({ ...validBody, offer: { insurerName: "A", monthlyPrice: -1 } }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...validBody, offer: { insurerName: "A", annualPrice: 2_000_000_000 } }).success).toBe(false);
  });

  it("conserve les champs d'offre additionnels (passthrough)", () => {
    const res = createQuoteSchema.safeParse({
      ...validBody,
      offer: { ...validBody.offer, features: ["a", "b"], matchedGuarantees: ["g1"] },
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.offer.features).toEqual(["a", "b"]);
  });
});

describe("contactMessageSchema (F-04)", () => {
  const valid = { name: "Jean", email: "jean@x.ci", subject: "Bonjour", message: "Un message" };

  it("accepte un message valide", () => {
    expect(contactMessageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette les champs manquants", () => {
    expect(contactMessageSchema.safeParse({ email: "jean@x.ci" }).success).toBe(false);
  });

  it("rejette un message trop long (borne de longueur)", () => {
    expect(contactMessageSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("requestCallbackSchema (F-04)", () => {
  it("accepte une demande valide", () => {
    expect(requestCallbackSchema.safeParse({ phone: "0700000000", insurerName: "SandyAssur" }).success).toBe(true);
  });

  it("rejette l'absence de téléphone ou d'assureur", () => {
    expect(requestCallbackSchema.safeParse({ insurerName: "A" }).success).toBe(false);
    expect(requestCallbackSchema.safeParse({ phone: "07" }).success).toBe(false);
  });
});
