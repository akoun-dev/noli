import { NextRequest } from "next/server";
import { forgotAction } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  return forgotAction(request);
}
