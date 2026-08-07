import { NextRequest } from "next/server";
import { loginAction } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  return loginAction(request);
}
