import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Find insurer account
    const account = await db.insurerAccount.findFirst({
      where: { profileId: userId },
      include: { insurer: { select: { id: true, logoUrl: true } } },
    });

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

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez PNG, JPG, WebP ou SVG." },
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
    await db.insurer.update({
      where: { id: account.insurerId },
      data: { logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Erreur logo upload:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du logo" },
      { status: 500 }
    );
  }
}