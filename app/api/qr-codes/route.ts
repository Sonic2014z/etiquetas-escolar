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
    let qrCode;
    try {
      qrCode = await upsertQRCode({
        hash: data.hash,
        nombreAlumno: data.nombreAlumno,
        cursoAlumno: data.cursoAlumno,
        telefonoApoderado: data.telefonoApoderado,
        nombreApoderado: data.nombreApoderado,
      });
    } catch (qrError) {
      logger.error("Error en upsertQRCode:", qrError);
      // Si es un error 405, proporcionar información más específica
      if (qrError instanceof Error && (qrError.message.includes('405') || qrError.message.includes('Method Not Allowed'))) {
        return NextResponse.json(
          { 
            error: 'El Content Type etiquetas-qr no está disponible para la API Key',
            details: 'Verifica en Strapi que el Content Type etiquetas-qr esté en los permisos de tu API Key. Si creaste el Content Type después de la API Key, necesitas recrear la API Key.',
            originalError: qrError.message
          },
          { status: 500 }
        );
      }
      throw qrError;
    }
    
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
