import { NextRequest, NextResponse } from "next/server";
import { compareRequestSchema } from "@/lib/validation";
import { runComparison } from "@/lib/compare-service";
import { getSessionProfile } from "@/lib/auth-guard";
import { getClientIp, checkPublicCompareLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Calcul tarifaire coûteux : rate limit par IP (anti-DoS).
    const limited = rateLimitResponse(checkPublicCompareLimit(getClientIp(request)));
    if (limited) return limited;

    const body = await request.json();

    const parsed = compareRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { personalInfo, vehicleInfo, coverageNeeds } = parsed.data;

    // L'identité provient de la session (jamais du client) :
    // un devis n'est lié à un compte que si l'utilisateur est connecté.
    const sessionProfile = await getSessionProfile();
    const userId = sessionProfile?.id;

    const result = await runComparison(personalInfo, vehicleInfo, coverageNeeds, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Erreur lors de la comparaison" }, { status: 500 });
  }
}
