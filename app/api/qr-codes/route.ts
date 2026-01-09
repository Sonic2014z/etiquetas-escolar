import { NextRequest, NextResponse } from 'next/server';
import { upsertQRCode } from '@/lib/api/qr-codes';

/**
 * API route para crear o actualizar QR codes en Strapi
 * POST /api/qr-codes -> almacena los datos del QR
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar que todos los campos requeridos estén presentes
    if (!data.hash || !data.nombreAlumno || !data.cursoAlumno || !data.telefonoApoderado || !data.nombreApoderado) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Crear o actualizar el QR code en Strapi
    const qrCode = await upsertQRCode({
      hash: data.hash,
      nombreAlumno: data.nombreAlumno,
      cursoAlumno: data.cursoAlumno,
      telefonoApoderado: data.telefonoApoderado,
      nombreApoderado: data.nombreApoderado,
    });
    
    return NextResponse.json({ success: true, data: qrCode });
  } catch (error: any) {
    console.error('Error storing QR code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store QR code' },
      { status: 500 }
    );
  }
}
