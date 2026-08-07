import { NextRequest } from "next/server";
import {
  registerAction,
  loginAction,
  logoutAction,
  forgotAction,
  meAction,
} from "@/lib/auth-actions";

/**
 * Endpoint historique POST /api/auth (action: register|login|logout|forgot|me).
 * Conservé pour la rétro-compatibilité ; les nouveaux appels doivent utiliser
 * les routes REST dédiées (POST /api/auth/register, /login, /logout, /forgot,
 * GET /api/auth/me).
 */
export async function POST(request: NextRequest) {
  let action = "me";
  try {
    // Lit l'action sur un clone : le body du request d'origine reste intact
    // pour les actions (register/login/forgot) qui le relisent ensuite.
    const clone = request.clone();
    const body = await clone.json();
    action = body?.action || "me";
  } catch {
    // Corps absent → comportement par défaut (me)
  }

  switch (action) {
    case "register":
      return registerAction(request);
    case "login":
      return loginAction(request);
    case "logout":
      return logoutAction(request);
    case "forgot":
      return forgotAction(request);
    case "me":
    default:
      return meAction();
  }
}
