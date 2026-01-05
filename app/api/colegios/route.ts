import { NextResponse } from 'next/server';
import { strapi } from '@/lib/api/strapi';
import type { Colegio } from '@/types/strapi';

/**
 * Interfaz para la respuesta de Strapi
 */
interface StrapiColegiosResponse {
  data: Colegio[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * GET /api/colegios
 * Obtiene todos los colegios desde Strapi
 * Esta ruta actúa como proxy para mantener el token seguro en el servidor
 */
export async function GET() {
  try {
    // Llamar a Strapi desde el servidor (donde el token está disponible)
    const response = await strapi.get<StrapiColegiosResponse>('colegios');
    
    // Debug: Log para verificar estructura (remover en producción)
    console.log('[API /api/colegios] Response structure:', JSON.stringify(response, null, 2).substring(0, 500));
    
    // Verificar que response tenga la estructura esperada
    if (!response || typeof response !== 'object') {
      console.error('[API /api/colegios] Invalid response structure:', response);
      return NextResponse.json([], { status: 200 });
    }
    
    // Extraer el array de colegios
    const colegios = response.data || [];
    
    // Validar que cada colegio tenga la estructura correcta
    const validColegios = colegios.filter((colegio: any) => {
      return colegio && 
             typeof colegio.id !== 'undefined' && 
             colegio.attributes && 
             typeof colegio.attributes === 'object';
    });
    
    // Retornar los datos validados al cliente
    return NextResponse.json(validColegios);
  } catch (error) {
    console.error('[API /api/colegios] Error:', error);
    
    // Retornar error al cliente
    return NextResponse.json(
      { error: 'Error al obtener colegios', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

