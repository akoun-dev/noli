import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Healthcheck d'exploitation (P0.2 du plan d'industrialisation).
 * - Liveness : le process répond.
 * - Readiness : la base Supabase/Postgres est joignable (ping léger, `head`).
 *
 * Renvoie 200 si la base répond, 503 sinon (pour PM2 / supervision uptime).
 * N'expose aucune donnée. Volontairement non authentifié (endpoint de sonde).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  try {
    const { error } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true });
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "up" : "down",
    latencyMs: Date.now() - startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
