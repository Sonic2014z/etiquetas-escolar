import { NextRequest, NextResponse } from 'next/server';
import { upsertQRCode } from '@/lib/api/qr-codes';
import { checkRateLimit, getRequestIP } from '@/lib/helpers/rate-limit';
import { logger } from '@/lib/helpers/logger';

/**
 * API route para crear o actualizar QR codes en Strapi
 * POST /api/qr-codes -> almacena los datos del QR
 */
interface QRCodeRequest {
  hash: string;
  nombreAlumno: string;
  cursoAlumno: string;
  telefonoApoderado: string;
  nombreApoderado: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: verificar límite de requests
    const clientIP = getRequestIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Por favor, intenta nuevamente más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }
    
    const data = await request.json() as Partial<QRCodeRequest>;
    
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
    
    return NextResponse.json({ success: true, data: qrCode }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to store QR code';
    // Error al guardar QR (log solo en desarrollo)
    logger.error('Error storing QR code:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
