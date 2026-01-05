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
 * Maneja paginación automáticamente para obtener todos los resultados
 */
export async function GET() {
  try {
    const allColegios: any[] = [];
    let page = 1;
    let pageSize = 100; // Máximo típico de Strapi (puede ser 100 o 1000 según configuración)
    let totalPages = 1;
    let hasMore = true;

    // Hacer requests paginados hasta obtener todos los colegios
    while (hasMore && page <= 100) { // Límite de seguridad: máximo 100 páginas
      // Construir URL con parámetros de paginación
      const paginationParams = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
      const path = `colegios?${paginationParams}`;
      
      // Llamar a Strapi con paginación
      const response = await strapi.get<any>(path);
      
      // Verificar que response tenga la estructura esperada
      if (!response || typeof response !== 'object' || !response.data) {
        console.error('[API /api/colegios] Invalid response structure en página', page);
        break;
      }
      
      // Agregar los colegios de esta página al array total
      const colegiosRaw = response.data || [];
      allColegios.push(...colegiosRaw);
      
      // Verificar información de paginación
      if (response.meta?.pagination) {
        totalPages = response.meta.pagination.pageCount || 1;
        const currentPage = response.meta.pagination.page || page;
        const total = response.meta.pagination.total || 0;
        
        console.log(`[API /api/colegios] Página ${currentPage}/${totalPages} - Total: ${total} - Cargados: ${allColegios.length}`);
        
        // Si ya cargamos todas las páginas, salir del loop
        if (currentPage >= totalPages || colegiosRaw.length === 0) {
          hasMore = false;
        }
      } else {
        // Si no hay información de paginación, asumir que esta es la última página
        hasMore = colegiosRaw.length === pageSize;
      }
      
      page++;
    }
    
    console.log(`[API /api/colegios] Total colegios cargados: ${allColegios.length}`);
    
    // Extraer el array de colegios (ya tenemos todos)
    const colegiosRaw = allColegios;
    
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

