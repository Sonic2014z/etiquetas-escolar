import { strapi } from "./strapi";
import type { Colegio } from "@/types/strapi";

/**
 * Interfaz para la respuesta de Strapi al obtener colegios
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
 * Obtiene todos los colegios desde Strapi
 * @returns Promise con array de colegios
 */
export async function getColegios(): Promise<Colegio[]> {
  try {
    // Llamar a la API de Strapi
    const response = await strapi.get<StrapiColegiosResponse>("colegios");
    
    // Strapi retorna los datos en { data: [...] }
    // Extraemos el array de colegios
    return response.data || [];
  } catch (error) {
    console.error("[getColegios] Error obteniendo colegios:", error);
    // Retornar array vacío en caso de error para no romper la UI
    return [];
  }
}

