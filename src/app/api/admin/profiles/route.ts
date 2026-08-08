import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { sanitizePostgrestSearch } from "@/lib/security";
import { updateProfileSchema } from "@/lib/validation";
import {
  getPagination,
  hasPaginationParams,
  paginationHeaders,
} from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const paginate = hasPaginationParams(searchParams);
    const { page, limit, offset } = getPagination(searchParams);

    let query = db
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      const s = sanitizePostgrestSearch(search);
      query = query.or(
        `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`
      );
    }
    if (paginate) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const profiles = mapRows(data || []);

    const profilesWithCount = await Promise.all(
      profiles.map(async (p) => {
        const { count: quoteCount } = await db
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.id);
        return { ...p, _count: { quotes: quoteCount ?? 0 } };
      })
    );

    const total = count ?? profiles.length;
    return NextResponse.json(profilesWithCount, {
      headers: paginationHeaders(total, page, limit),
    });
  } catch (error) {
    console.error("Erreur profiles GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des profils" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 }
      );
    }
    const { id, firstName, lastName, phone, role, isActive } = parsed.data;

    const { data: existingData } = await db
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!existingData) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.first_name = firstName || null;
    if (lastName !== undefined) updateData.last_name = lastName || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: profileData, error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const profile = mapRow(profileData);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur profiles PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
