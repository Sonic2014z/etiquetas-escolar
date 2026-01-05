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
    const response = await strapi.get<any>('colegios');
    
    // Verificar que response tenga la estructura esperada
    if (!response || typeof response !== 'object') {
      console.error('[API /api/colegios] Invalid response structure:', response);
      return NextResponse.json([], { status: 200 });
    }
    
    // Extraer el array de colegios
    const colegiosRaw = response.data || [];
    
    // Normalizar los datos: Strapi puede retornar con o sin "attributes"
    // Convertimos a la estructura esperada: { id, attributes: { ... } }
    const colegiosNormalizados: Colegio[] = colegiosRaw.map((colegio: any) => {
      // Si ya tiene la estructura con attributes, retornarlo tal cual
      if (colegio.attributes && typeof colegio.attributes === 'object') {
        return colegio;
      }
      
      // Si no tiene attributes, los campos están directamente en el objeto
      // Extraemos id y el resto va a attributes
      const { id, ...resto } = colegio;
      
      return {
        id: id || colegio.id,
        attributes: {
          rbd: resto.rbd || colegio.rbd,
          colegio_nombre: resto.colegio_nombre || colegio.colegio_nombre || '',
          dependencia: resto.dependencia || colegio.dependencia || '',
          comuna: resto.comuna || colegio.comuna || '',
          region: resto.region || colegio.region || '',
        },
      };
    }).filter((colegio: Colegio) => {
      // Filtrar solo colegios válidos
      return colegio && 
             typeof colegio.id !== 'undefined' && 
             colegio.attributes && 
             colegio.attributes.colegio_nombre;
    });
    
    // Retornar los datos normalizados al cliente
    return NextResponse.json(colegiosNormalizados, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /api/colegios] Error:', error);
    
    // Retornar error al cliente
    return NextResponse.json(
      { error: 'Error al obtener colegios', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

