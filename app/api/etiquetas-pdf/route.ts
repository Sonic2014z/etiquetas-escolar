import { NextRequest, NextResponse } from 'next/server';
import { strapi } from '@/lib/api/strapi';
import type { EtiquetaPDF, StrapiCollectionResponse } from '@/types/strapi';
import { logger } from '@/lib/helpers/logger';
import { env } from '@/lib/env';

/**
 * GET /api/etiquetas-pdf
 * Obtiene todos los PDFs con filtros opcionales
 * Query params:
 * - search: búsqueda general en múltiples campos
 * - año_escolar: filtrar por año
 * - estado: filtrar por estado (generado, impreso, archivado)
 * - page: número de página (paginación)
 * - pageSize: tamaño de página
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const añoEscolar = searchParams.get('año_escolar');
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Construir filtros
    const filters: string[] = [];
    
    // Búsqueda general (busca en múltiples campos)
    if (search) {
      const searchEncoded = encodeURIComponent(search);
      // Buscar en número de orden (si es numérico)
      if (/^\d+$/.test(search)) {
        filters.push(`filters[numero_orden][$eq]=${search}`);
      } else {
        // Buscar en hash_qr, colegio_nombre
        // Nota: La búsqueda en apoderado/alumno se hace en el cliente después de obtener los datos
        // porque Strapi requiere populate específico para buscar en relaciones
        filters.push(`filters[$or][0][hash_qr][$contains]=${searchEncoded}`);
        filters.push(`filters[$or][1][colegio_nombre][$contains]=${searchEncoded}`);
      }
    }

    // Filtro por año escolar
    if (añoEscolar) {
      filters.push(`filters[año_escolar][$eq]=${añoEscolar}`);
    }

    // Filtro por estado
    if (estado && ['generado', 'impreso', 'archivado'].includes(estado)) {
      filters.push(`filters[estado][$eq]=${estado}`);
    }

    // Construir query string
    const filterQuery = filters.length > 0 ? `&${filters.join('&')}` : '';
    const paginationQuery = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    // Populate específico: solo los campos que necesitamos
    // Sin usar * para evitar populate de relaciones anidadas problemáticas en Strapi v5
    const populateQuery = [
      'populate[apoderado][fields]=nombres,primer_apellido,segundo_apellido',
      'populate[alumno][fields]=nombres,primer_apellido,segundo_apellido',
      'populate[archivo_pdf][fields]=id,url,name,mime,size'
    ].join('&');
    
    const path = `etiquetas-pdf?${paginationQuery}&${populateQuery}${filterQuery}`;

    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(path);

    // Construir URLs completas para los PDFs
    const pdfsWithUrls = (response.data || []).map((pdf) => {
      if (pdf.archivo_pdf?.url) {
        const pdfUrl = pdf.archivo_pdf.url.startsWith('http')
          ? pdf.archivo_pdf.url
          : `${env.STRAPI_URL}${pdf.archivo_pdf.url}`;
        
        return {
          ...pdf,
          archivo_pdf: {
            ...pdf.archivo_pdf,
            fullUrl: pdfUrl,
          },
        };
      }
      return pdf;
    });

    return NextResponse.json({
      data: pdfsWithUrls,
      meta: response.meta,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('Error obteniendo PDFs:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener PDFs',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
