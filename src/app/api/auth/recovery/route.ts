import { NextRequest } from "next/server";
import { recoveryExchangeAction } from "@/lib/auth-actions";

// Échange le `code` PKCE du lien de récupération contre une session httpOnly
// (côté serveur). Voir recoveryExchangeAction (TEC-AUTH-01).
export async function POST(request: NextRequest) {
  return recoveryExchangeAction(request);
}
