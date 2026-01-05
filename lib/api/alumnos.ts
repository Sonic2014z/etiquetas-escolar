import { strapi } from "./strapi";
import type { Alumno, StrapiCollectionResponse, StrapiResponse } from "@/types/strapi";

/**
 * Busca un alumno por criterios (nombres, apellidos, curso, letra, colegio)
 */
export async function findAlumno(data: {
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  curso: string;
  letra: string;
  colegio: string;
}): Promise<Alumno | null> {
  try {
    // Construimos los filtros
    const filters: string[] = [
      `filters[nombres][$eq]=${encodeURIComponent(data.nombres)}`,
      `filters[primer_apellido][$eq]=${encodeURIComponent(data.primer_apellido)}`,
      `filters[curso][$eq]=${encodeURIComponent(data.curso)}`,
      `filters[letra][$eq]=${encodeURIComponent(data.letra)}`,
      `filters[colegio][$eq]=${encodeURIComponent(data.colegio)}`,
    ];
    
    if (data.segundo_apellido) {
      filters.push(`filters[segundo_apellido][$eq]=${encodeURIComponent(data.segundo_apellido)}`);
    }
    
    const response = await strapi.get<StrapiCollectionResponse<Alumno>>(
      `etiquetas-alumnos?${filters.join("&")}&populate=apoderado`
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error("Error buscando alumno:", error);
    throw error;
  }
}

/**
 * Crea un nuevo alumno en Strapi
 */
export async function createAlumno(data: {
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  curso: string;
  letra: string;
  colegio: string;
  apoderadoId?: number;
}): Promise<Alumno> {
  try {
    const payload: any = {
      nombres: data.nombres,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido || "",
      curso: data.curso,
      letra: data.letra,
      colegio: data.colegio,
    };
    
    // Si hay apoderadoId, lo relacionamos
    // En Strapi v4, las relaciones pueden requerir el ID directamente o un objeto con connect
    if (data.apoderadoId) {
      payload.apoderado = data.apoderadoId;
    }
    
    console.log("[createAlumno] Payload enviado:", JSON.stringify(payload, null, 2));
    
    const response = await strapi.post<StrapiResponse<Alumno>>(
      "etiquetas-alumnos",
      payload
    );
    
    return response.data;
  } catch (error) {
    console.error("Error creando alumno:", error);
    throw error;
  }
}

