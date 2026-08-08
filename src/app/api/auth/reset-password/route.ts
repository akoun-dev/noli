import { NextRequest } from "next/server";
import { resetPasswordAction } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  return resetPasswordAction(request);
}
