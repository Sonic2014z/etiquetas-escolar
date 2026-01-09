import { NextRequest, NextResponse } from 'next/server';
import { regenerateWhatsAppUrl, type QRData } from '@/lib/helpers/qr-hash';
import { findQRByHash } from '@/lib/api/qr-codes';

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
    
    // Buscar los datos en Strapi
    const qrRecord = await findQRByHash(id);
    
    if (!qrRecord) {
      return NextResponse.json(
        { error: 'QR code not found. Please generate a new QR code.' },
        { status: 404 }
      );
    }
    
    // Convertir datos de Strapi al formato QRData
    const data: QRData = {
      studentName: qrRecord.nombreAlumno,
      studentGrade: qrRecord.cursoAlumno,
      parentPhone: qrRecord.telefonoApoderado,
      parentName: qrRecord.nombreApoderado,
    };
    
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
