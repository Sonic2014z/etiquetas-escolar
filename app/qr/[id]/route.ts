import { NextRequest, NextResponse } from 'next/server';
import { regenerateWhatsAppUrl } from '@/lib/helpers/qr-hash';

/**
 * Decodifica un string compacto desde base64 URL-safe
 */
function compactDecode(encoded: string): string {
  try {
    // Convertir de URL-safe a base64 normal
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Agregar padding si es necesario
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Invalid encoded data');
  }
}

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
    
    // Obtener los datos desde query params
    const searchParams = request.nextUrl.searchParams;
    const n = searchParams.get('n');
    const g = searchParams.get('g');
    const p = searchParams.get('p');
    const a = searchParams.get('a');
    
    if (!n || !g || !p || !a) {
      return NextResponse.json(
        { error: 'Missing QR code data' },
        { status: 400 }
      );
    }
    
    // Decodificar los datos compactos
    const studentName = compactDecode(n);
    const studentGrade = compactDecode(g);
    const parentPhone = p; // Ya está en formato numérico
    const parentName = compactDecode(a);
    
    // Regenerar URL de WhatsApp desde los datos
    const whatsappUrl = regenerateWhatsAppUrl({
      studentName,
      studentGrade,
      parentPhone,
      parentName,
    });
    
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
