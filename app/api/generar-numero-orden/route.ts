import { NextResponse } from "next/server";
import { logger } from "@/lib/helpers/logger";
import { generateUniqueOrderNumber } from "@/lib/helpers/order-number";

/**
 * GET /api/generar-numero-orden
 * Genera el siguiente número de orden secuencial único para el año actual
 * Formato: YYYY + NNNNNNN (11 dígitos)
 */
export async function GET() {
  try {
    const orderNumber = await generateUniqueOrderNumber();

    return NextResponse.json({
      numero_orden: orderNumber,
      año: new Date().getFullYear(),
    });
  } catch (error) {
    logger.error('Error generando número de orden:', error);
    return NextResponse.json(
      {
        error: 'No se pudo generar el número de orden',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
