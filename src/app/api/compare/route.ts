import { NextRequest, NextResponse } from "next/server";
import { compareRequestSchema } from "@/lib/validation";
import { runComparison } from "@/lib/compare-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = compareRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { personalInfo, vehicleInfo, coverageNeeds, userId } = parsed.data;
    const result = await runComparison(personalInfo, vehicleInfo, coverageNeeds, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Erreur lors de la comparaison" }, { status: 500 });
  }
}
