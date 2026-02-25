import type { Colegio } from "@/types/strapi";
import { logger } from "@/lib/helpers/logger";

/**
 * Obtiene todos los colegios desde Strapi
 * Usa la API route de Next.js como proxy para mantener el token seguro
 * @param search Término opcional de búsqueda por nombre de colegio
 * @returns Promise con array de colegios
 */
export async function getColegios(search?: string): Promise<Colegio[]> {
  try {
    const trimmedSearch = search?.trim();
    const hasSearch = !!trimmedSearch && trimmedSearch.length >= 3;

    const url = hasSearch
      ? `/api/colegios?search=${encodeURIComponent(trimmedSearch!)}`
      : '/api/colegios';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`Error al obtener colegios: ${response.status}`);
    }

    // La API route ya retorna el array de colegios directamente
    const colegios: Colegio[] = await response.json();
    return colegios;
  } catch (error) {
    logger.error("[getColegios] Error obteniendo colegios:", error);
    // Retornar array vacío en caso de error para no romper la UI
    return [];
  }
}

