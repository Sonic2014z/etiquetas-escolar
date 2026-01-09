import { NextRequest, NextResponse } from 'next/server';
import { regenerateWhatsAppUrl, type QRData } from '@/lib/helpers/qr-hash';

// Almacenamiento temporal en memoria (Map)
// En producción, considera usar Redis o una base de datos para persistencia
const qrDataCache = new Map<string, QRData>();

/**
 * Ruta de redirección para QRs con URL intermediaria
 * GET /qr/[id] -> redirige a WhatsApp
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar los datos en el cache
    const data = qrDataCache.get(id);
    
    if (!data) {
      return NextResponse.json(
        { error: 'QR code not found or expired. Please generate a new QR code.' },
        { status: 404 }
      );
    }
    
    // Regenerar URL de WhatsApp desde los datos
    const whatsappUrl = regenerateWhatsAppUrl(data);
    
    // Redirigir a WhatsApp
    return NextResponse.redirect(whatsappUrl, 302);
  } catch (error) {
    console.error('Error redirecting QR:', error);
    return NextResponse.json(
      { error: 'Invalid QR code' },
      { status: 400 }
    );
  }
}

/**
 * Endpoint para almacenar datos del QR en el cache
 * POST /qr/[id] -> almacena los datos
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: QRData = await request.json();
    
    // Almacenar en cache (expira después de 1 año - tiempo suficiente para etiquetas)
    qrDataCache.set(id, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing QR data:', error);
    return NextResponse.json(
      { error: 'Failed to store QR data' },
      { status: 500 }
    );
  }
}
