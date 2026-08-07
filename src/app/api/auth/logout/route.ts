import { NextRequest } from "next/server";
import { logoutAction } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  return logoutAction(request);
}
