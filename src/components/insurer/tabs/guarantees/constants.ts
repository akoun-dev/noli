/* Constantes de module du wizard de garanties assureur */

import { DollarSign, Percent, LayoutGrid, CircleDot } from "lucide-react";
import type { CalculationType, Step1Data } from "./types";

export const VN_RANGES = [
  { label: "≤ 12M", min: 0, max: 12_000_000, key: "A" },
  { label: "12M – 25M", min: 12_000_001, max: 25_000_000, key: "B" },
  { label: "25M – 40M", min: 25_000_001, max: 40_000_000, key: "C" },
  { label: "40M – 90M", min: 40_000_001, max: 90_000_000, key: "D" },
  { label: "90M – 110M", min: 90_000_001, max: 110_000_000, key: "E" },
  { label: "> 110M", min: 110_000_001, max: 999_999_999, key: "F" },
] as const;

export const FRANCHISE_LEVELS = [
  { label: "Sans franchise", value: 0 },
  { label: "250K", value: 250_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
  { label: "2.5M", value: 2_500_000 },
] as const;

export const emptyStep1: Step1Data = {
  name: "",
  insuranceCategoryId: "",
  categoryId: "",
  description: "",
  isMandatory: false,
  isOptional: false,
  conditions: "",
  displayOrder: "0",
};

export const calcBadge: Record<string, string> = {
  FREE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  FIXED_AMOUNT: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  VARIABLE_BASED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MATRIX_BASED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
};

export const calcLabel: Record<string, string> = {
  FREE: "Gratuit",
  FIXED_AMOUNT: "Montant fixe",
  VARIABLE_BASED: "Variable",
  MATRIX_BASED: "Matrice tarifaire",
};

// Taille de page pour la pagination en mémoire (filtrage client)
export const PAGE_SIZE = 25;

export const step2Options: {
  type: CalculationType;
  label: string;
  description: string;
  icon: typeof DollarSign;
  formula: string;
}[] = [
  {
    type: "FREE",
    label: "Gratuit",
    description:
      "Aucun frais additionnel. Prime = 0 FCFA. Idéal pour les garanties promotionnelles ou incluses.",
    icon: CircleDot,
    formula: "Prime = 0 FCFA",
  },
  {
    type: "FIXED_AMOUNT",
    label: "Montant fixe",
    description:
      "Un montant fixe est appliqué indépendamment des paramètres du véhicule. Ex: Assistance à 5 000 FCFA.",
    icon: DollarSign,
    formula: "Prime = Montant fixe (ou prix réduit en pack)",
  },
  {
    type: "VARIABLE_BASED",
    label: "Basé sur une variable du véhicule",
    description:
      "Le montant est calculé en pourcentage d'une variable (VN, VA, Puissance fiscale) avec option de seuil conditionnel.",
    icon: Percent,
    formula: "Prime = Variable × (Taux / 100)",
  },
  {
    type: "MATRIX_BASED",
    label: "Matrice tarifaire",
    description:
      "Le montant est déterminé par lookup dans une grille multi-dimensionnelle (PF, carburant, catégorie, formule).",
    icon: LayoutGrid,
    formula: "Prime = lookup dans la grille",
  },
];

export const matrixDimensions = [
  { value: "FISCAL_POWER", label: "Puissance fiscale (CV)" },
  { value: "VEHICLE_CATEGORY", label: "Catégorie de véhicule" },
  { value: "FORMULA", label: "Formule (IC/IPT)" },
  { value: "TIERCE_COMPLETE", label: "Tierce complète" },
  { value: "TIERCE_COLLISION", label: "Tierce collision" },
];

export const variableSources = [
  { value: "NEW_VALUE", label: "Valeur Neuve (VN)" },
  { value: "VENAL_VALUE", label: "Valeur Vénale (VA)" },
  { value: "FISCAL_POWER", label: "Puissance Fiscale (PF)" },
];
