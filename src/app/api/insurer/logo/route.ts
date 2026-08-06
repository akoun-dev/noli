import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSessionProfile, requireAuth } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const profile = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });

    // Find insurer account from the session (never from a client header)
    const { data } = await db
      .from("insurer_accounts")
      .select("insurer_id, insurer:insurers(id, logoUrl:logo_url)")
      .eq("profile_id", profile.id)
      .maybeSingle();
    const account = mapRow(data);

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    // Validate file type — SVG est interdit (risque XSS stockée)
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez PNG, JPG ou WebP." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 2 Mo)" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `${randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");

    // Ensure directory exists
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadsDir, filename), buffer);

    // Build URL path
    const logoUrl = `/uploads/logos/${filename}`;

    // Update insurer in DB
    await db.from("insurers").update({ logo_url: logoUrl }).eq("id", account.insurerId);

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Erreur logo upload:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du logo" },
      { status: 500 }
    );
  }
}