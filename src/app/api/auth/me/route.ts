import { meAction } from "@/lib/auth-actions";

export async function GET() {
  return meAction();
}
