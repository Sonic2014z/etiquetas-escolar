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

export async function GET() {
  try {
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
        console.error('[API /api/colegios] Invalid response structure en página', page);
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
    
    // Normalizar los datos para Strapi v5: Los datos están directamente en el objeto
    // Convertimos a la estructura esperada: { id, rbd, colegio_nombre, ... }
    const colegiosNormalizados: Colegio[] = colegiosRaw.map((colegio: StrapiColegioRaw): Colegio => {
      // Si ya tiene la estructura v5 (sin attributes), normalizar asegurando que rbd sea number
      if (colegio.id && colegio.colegio_nombre && !colegio.attributes) {
        return {
          id: colegio.id,
          rbd: colegio.rbd ?? 0, // Asegurar que rbd sea number, no undefined
          colegio_nombre: colegio.colegio_nombre,
          dependencia: colegio.dependencia || '',
          comuna: colegio.comuna || '',
          region: colegio.region || '',
        };
      }
      
      // Si viene con estructura v4 (con attributes), extraer los datos
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
      
      // Si no tiene attributes, los campos están directamente en el objeto
      return {
        id: colegio.id,
        rbd: colegio.rbd ?? 0,
        colegio_nombre: colegio.colegio_nombre || '',
        dependencia: colegio.dependencia || '',
        comuna: colegio.comuna || '',
        region: colegio.region || '',
      };
    }).filter((colegio: Colegio) => {
      // Filtrar solo colegios válidos
      return colegio && 
             typeof colegio.id !== 'undefined' && 
             colegio.colegio_nombre &&
             colegio.colegio_nombre.trim().length > 0;
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

