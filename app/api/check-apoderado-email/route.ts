import { NextRequest, NextResponse } from "next/server";
import { findApoderadoByEmail } from "@/lib/api/apoderados";

/**
 * GET /api/check-apoderado-email?email=...
 * Comprueba si ya existe un apoderado con ese correo en Strapi.
 * Solo devuelve { exists: boolean } sin datos del apoderado.
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email || !email.trim()) {
      return NextResponse.json({ exists: false });
    }

    const apoderado = await findApoderadoByEmail(email.trim());
    return NextResponse.json({ exists: !!apoderado });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
