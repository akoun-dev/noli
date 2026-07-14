import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      name: "NOLI Assurance API",
      version: "1.0.0",
    });
  } catch (error) {
    console.error("API root error:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}