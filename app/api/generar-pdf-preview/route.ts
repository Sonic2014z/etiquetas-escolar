import { NextRequest, NextResponse } from "next/server";

/**
 * API route para generar PDF desde la página de preview
 * GET /api/generar-pdf-preview
 * 
 * Esta ruta ha sido deshabilitada ya que el diseño final está implementado en /etiquetas
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "Not Found",
      message: "Esta ruta ya no está disponible. El diseño final está implementado en /etiquetas"
    },
    { status: 404 }
  );
}
