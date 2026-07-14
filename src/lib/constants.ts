export const MAX_COMPARE = 4;

export const COVERAGE_OPTIONS = ["Tous", "Tiers", "Tiers+", "Tous Risques"] as const;

export const BUDGET_MAX = 300000;
export const BUDGET_STEP = 5000;

export const USAGE_OPTIONS = [
  { value: "personnel", label: "Personnel" },
  { value: "professionnel", label: "Professionnel" },
  { value: "taxi_vtc", label: "Taxi / VTC" },
  { value: "autre", label: "Autre" },
] as const;

export const COVERAGE_CODE_MAP: Record<string, string> = {
  RC: "Responsabilité Civile",
  DR: "Défense et Recours",
  IC: "Individuelle Conducteur",
  IPT: "Individuelle Passagers",
  INCENDIE: "Incendie",
  VOL: "Vol",
  BDG: "Bris de Glaces",
  TCM: "Tierce Complète",
  TCL: "Tierce Collision",
  ASSISTANCE: "Assistance",
  AVANCE_RECOURS: "Avance sur Recours",
  VOL_ACCESSOIRES: "Vol des accessoires",
  RTI: "Recours tiers Incendie",
};

export function resolveCoverageName(value: string): string {
  return COVERAGE_CODE_MAP[value] || value;
}
