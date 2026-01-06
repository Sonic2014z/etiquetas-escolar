import { strapi } from "./strapi";
import type { Alumno, StrapiCollectionResponse, StrapiResponse } from "@/types/strapi";

/**
 * Verifica que un alumno existe por ID
 */
export async function verifyAlumnoExists(alumnoId: number): Promise<Alumno | null> {
  try {
    const response = await strapi.get<StrapiResponse<Alumno>>(
      `etiquetas-alumnos/${alumnoId}`
    );
    
    return response.data || null;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      return null;
    }
    console.error("Error verificando alumno por ID:", error);
    throw error;
  }
}

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
 * Crea un nuevo alumno en Strapi (sin relación, se establece después)
 */
export async function createAlumno(data: {
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  curso: string;
  letra: string;
  colegio: string;
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
    
    const response = await strapi.post<StrapiResponse<Alumno>>(
      "etiquetas-alumnos",
      payload
    );
    
    if (!response.data || !response.data.id) {
      throw new Error("Error: Strapi no devolvió ID al crear alumno");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error creando alumno:", error);
    throw error;
  }
}

/**
 * Actualiza un alumno existente agregando una relación con un apoderado
 */
export async function updateAlumnoWithApoderado(
  alumnoDocumentId: string,
  apoderadoDocumentId: string
): Promise<Alumno | null> {
  try {
    const response = await strapi.put<StrapiResponse<Alumno>>(
      `etiquetas-alumnos/${alumnoDocumentId}`,
      {
        apoderado: apoderadoDocumentId,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error actualizando alumno con apoderado:", error);
    return null;
  }
}

