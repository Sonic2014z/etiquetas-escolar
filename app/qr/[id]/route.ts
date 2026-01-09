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
    
    // Validar que los datos necesarios estén presentes
    if (!data.parentPhone || !data.studentName || !data.parentName) {
      return NextResponse.json(
        { error: 'QR code data is incomplete' },
        { status: 400 }
      );
    }
    
    // Regenerar URL de WhatsApp desde los datos (con manejo de errores)
    let whatsappUrl: string;
    try {
      whatsappUrl = regenerateWhatsAppUrl(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Error al regenerar URL (log solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error regenerating WhatsApp URL:', error);
      }
      return NextResponse.json(
        { 
          error: 'Invalid QR code data. Unable to generate WhatsApp URL.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 400 }
      );
    }
    
    // Validar que la URL generada es válida
    if (!whatsappUrl || !whatsappUrl.startsWith('https://wa.me/')) {
      return NextResponse.json(
        { error: 'Invalid WhatsApp URL generated' },
        { status: 500 }
      );
    }
    
    // Redirigir a WhatsApp
    return NextResponse.redirect(whatsappUrl, 302);
  } catch (error) {
    // Error general (log solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error redirecting QR:', error);
    }
    return NextResponse.json(
      { error: 'Invalid QR code' },
      { status: 400 }
    );
  }
}
