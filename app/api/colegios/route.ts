import { NextResponse } from 'next/server';
import { strapi } from '@/lib/api/strapi';
import type { Colegio } from '@/types/strapi';
import { logger } from '@/lib/helpers/logger';

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
interface StrapiColegioRaw {
  id: number;
  rbd?: number;
  colegio_nombre?: string;
  dependencia?: string;
  comuna?: string;
  region?: string;
  attributes?: {
    rbd?: number;
    colegio_nombre?: string;
    dependencia?: string;
    comuna?: string;
    region?: string;
  };
}

interface StrapiPaginationResponse {
  data: StrapiColegioRaw[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

function normalizeColegios(colegiosRaw: StrapiColegioRaw[]): Colegio[] {
  return colegiosRaw
    .map((colegio: StrapiColegioRaw): Colegio => {
      if (colegio.id && colegio.colegio_nombre && !colegio.attributes) {
        return {
          id: colegio.id,
          rbd: colegio.rbd ?? 0,
          colegio_nombre: colegio.colegio_nombre,
          dependencia: colegio.dependencia || '',
          comuna: colegio.comuna || '',
          region: colegio.region || '',
        };
      }

      if (colegio.attributes && typeof colegio.attributes === 'object') {
        return {
          id: colegio.id,
          rbd: colegio.attributes.rbd ?? colegio.rbd ?? 0,
          colegio_nombre: colegio.attributes.colegio_nombre || colegio.colegio_nombre || '',
          dependencia: colegio.attributes.dependencia || colegio.dependencia || '',
          comuna: colegio.attributes.comuna || colegio.comuna || '',
          region: colegio.attributes.region || colegio.region || '',
        };
      }

      return {
        id: colegio.id,
        rbd: colegio.rbd ?? 0,
        colegio_nombre: colegio.colegio_nombre || '',
        dependencia: colegio.dependencia || '',
        comuna: colegio.comuna || '',
        region: colegio.region || '',
      };
    })
    .filter((colegio: Colegio) => {
      return (
        colegio &&
        typeof colegio.id !== 'undefined' &&
        colegio.colegio_nombre &&
        colegio.colegio_nombre.trim().length > 0
      );
    });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    // Búsqueda por nombre de colegio (modo "live search")
    if (search && search.length >= 3) {
      const page = 1;
      const pageSize = 50;
      const encodedSearch = encodeURIComponent(search);
      const paginationParams = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
      const filterParams = `filters[colegio_nombre][$containsi]=${encodedSearch}`;
      const path = `colegios?${paginationParams}&${filterParams}`;

      const response = await strapi.get<StrapiPaginationResponse>(path);

      if (!response || typeof response !== 'object' || !response.data) {
        logger.error('[API /api/colegios] Invalid response structure en búsqueda', {
          search,
        });
        return NextResponse.json([], { status: 200 });
      }

      const colegiosRaw = response.data || [];
      const colegiosNormalizados = normalizeColegios(colegiosRaw);

      return NextResponse.json(colegiosNormalizados, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      });
    }

    const allColegios: StrapiColegioRaw[] = [];
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
      const response = await strapi.get<StrapiPaginationResponse>(path);
      
      // Verificar que response tenga la estructura esperada
      if (!response || typeof response !== 'object' || !response.data) {
        logger.error('[API /api/colegios] Invalid response structure en página', page);
        break;
      }
      
      // Agregar los colegios de esta página al array total
      const colegiosRaw = response.data || [];
      allColegios.push(...colegiosRaw);
      
      if (response.meta?.pagination) {
        totalPages = response.meta.pagination.pageCount || 1;
        const currentPage = response.meta.pagination.page || page;
        
        if (currentPage >= totalPages || colegiosRaw.length === 0) {
          hasMore = false;
        }
      } else {
        hasMore = colegiosRaw.length === pageSize;
      }
      
      page++;
    }
    
    // Extraer el array de colegios (ya tenemos todos)
    const colegiosRaw = allColegios;
    
    // Normalizar y filtrar colegios válidos
    const colegiosNormalizados: Colegio[] = normalizeColegios(colegiosRaw);
    
    // Retornar los datos normalizados al cliente
    return NextResponse.json(colegiosNormalizados, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    // Log sanitizado sin exponer detalles completos del error
    logger.error('[API /api/colegios] Error', {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      hasMessage: !!(error instanceof Error ? error.message : false),
    });
    
    // Retornar error al cliente
    return NextResponse.json(
      { error: 'Error al obtener colegios', message: 'No se pudo obtener la lista de colegios. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}

