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
    
    // Retornar los datos al cliente
    return NextResponse.json(response.data || []);
  } catch (error) {
    console.error('[API /api/colegios] Error:', error);
    
    // Retornar error al cliente
    return NextResponse.json(
      { error: 'Error al obtener colegios', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

