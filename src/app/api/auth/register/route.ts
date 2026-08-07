import { NextRequest } from "next/server";
import { registerAction } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  return registerAction(request);
}
