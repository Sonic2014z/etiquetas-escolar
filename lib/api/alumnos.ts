import { strapi } from "./strapi";
import type { Alumno, StrapiCollectionResponse, StrapiResponse } from "@/types/strapi";

/**
 * Verifica que un alumno existe por ID
 */
export async function verifyAlumnoExists(alumnoId: number): Promise<Alumno | null> {
  try {
    console.log(`[verifyAlumnoExists] Buscando alumno con ID: ${alumnoId}`);
    const response = await strapi.get<StrapiResponse<Alumno>>(
      `etiquetas-alumnos/${alumnoId}`
    );
    
    console.log(`[verifyAlumnoExists] Respuesta completa:`, JSON.stringify(response, null, 2));
    
    if (response.data) {
      const idReal = response.data.id;
      console.log(`[verifyAlumnoExists] ID solicitado: ${alumnoId}, ID devuelto por Strapi: ${idReal}`);
      
      if (idReal !== alumnoId) {
        console.warn(`[verifyAlumnoExists] ⚠️ ID diferente! Solicitado: ${alumnoId}, Devuelto: ${idReal}`);
      }
      
      return response.data;
    }
    return null;
  } catch (error: any) {
    // Si es 404, el alumno no existe
    if (error.message?.includes('404')) {
      console.log(`[verifyAlumnoExists] Alumno ${alumnoId} no encontrado (404)`);
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
    
    // NO establecemos la relación aquí - se hará después de verificar que ambos existen
    
    console.log("[createAlumno] Payload enviado:", JSON.stringify(payload, null, 2));
    
    const response = await strapi.post<StrapiResponse<Alumno>>(
      "etiquetas-alumnos",
      payload
    );
    
    console.log("[createAlumno] Respuesta completa:", JSON.stringify(response, null, 2));
    console.log("[createAlumno] ID extraído:", response.data?.id);
    
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
  alumnoId: number,
  apoderadoId: number
): Promise<Alumno | null> {
  try {
    console.log(`[updateAlumnoWithApoderado] Actualizando alumno ${alumnoId} con apoderado ${apoderadoId}`);
    
    // Actualizamos el alumno con la relación al apoderado
    const response = await strapi.put<StrapiResponse<Alumno>>(
      `etiquetas-alumnos/${alumnoId}`,
      {
        apoderado: apoderadoId,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error actualizando alumno con apoderado:", error);
    // No lanzamos el error, solo lo registramos
    return null;
  }
}

