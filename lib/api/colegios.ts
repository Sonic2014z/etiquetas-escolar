import type { Colegio } from "@/types/strapi";
import { logger } from "@/lib/helpers/logger";

/**
 * Obtiene todos los colegios desde Strapi
 * Usa la API route de Next.js como proxy para mantener el token seguro
 * @returns Promise con array de colegios
 */
export async function getColegios(): Promise<Colegio[]> {
  try {
    // Llamar a nuestra API route de Next.js (que actúa como proxy)
    // Esta ruta está en el servidor donde el token está disponible
    const response = await fetch('/api/colegios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Permitimos que el navegador/proxy cachee la respuesta para mejorar tiempos
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

