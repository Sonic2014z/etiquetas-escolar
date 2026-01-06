import { strapi } from "./strapi";
import type { Apoderado, StrapiCollectionResponse, StrapiResponse } from "@/types/strapi";

/**
 * Verifica que un apoderado existe por ID
 */
export async function verifyApoderadoExists(apoderadoId: number): Promise<Apoderado | null> {
  try {
    const response = await strapi.get<StrapiResponse<Apoderado>>(
      `etiquetas-apoderados/${apoderadoId}`
    );
    
    return response.data || null;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      return null;
    }
    console.error("Error verificando apoderado por ID:", error);
    throw error;
  }
}

/**
 * Busca un apoderado por RUT
 */
export async function findApoderadoByRut(rut: string): Promise<Apoderado | null> {
  try {
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    const response = await strapi.get<StrapiCollectionResponse<Apoderado>>(
      `etiquetas-apoderados?filters[rut][$eq]=${cleanRut}&populate=alumnos`
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error("Error buscando apoderado por RUT:", error);
    throw error;
  }
}

/**
 * Crea un nuevo apoderado en Strapi
 */
export async function createApoderado(data: {
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  rut: string;
  telefono: string;
  email?: string;
  uid: string;
}): Promise<Apoderado> {
  try {
    const payload: any = {
      nombres: data.nombres,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido || "",
      rut: data.rut.replace(/[^0-9kK]/g, ''), // Limpiar RUT
      telefono: data.telefono,
      uid: data.uid,
    };
    
    if (data.email && data.email.trim() !== "") {
      payload.email = data.email;
    } else {
      payload.email = null;
    }
    
    const response = await strapi.post<StrapiResponse<Apoderado>>(
      "etiquetas-apoderados",
      payload
    );
    
    return response.data;
  } catch (error) {
    console.error("Error creando apoderado:", error);
    throw error;
  }
}

/**
 * Actualiza un apoderado existente agregando una relación con un alumno
 */
export async function updateApoderadoWithAlumno(
  apoderadoDocumentId: string,
  alumnoDocumentId: string
): Promise<Apoderado | null> {
  try {
    // Intentamos obtener el apoderado con sus alumnos actuales
    let alumnosExistentesDocumentIds: string[] = [];
    
    try {
      const apoderadoResponse = await strapi.get<StrapiResponse<Apoderado>>(
        `etiquetas-apoderados/${apoderadoDocumentId}?populate=alumnos`
      );
      
      const apoderado = apoderadoResponse.data;
      
      // Extraer documentIds de los alumnos existentes
      if (Array.isArray(apoderado.alumnos)) {
        alumnosExistentesDocumentIds = apoderado.alumnos.map((a) => a.documentId);
      } else if ((apoderado.alumnos as any)?.data) {
        alumnosExistentesDocumentIds = (apoderado.alumnos as any).data.map((a: any) => a.documentId || a.id);
      }
      
      if (alumnosExistentesDocumentIds.includes(alumnoDocumentId)) {
        return apoderado;
      }
    } catch (getError: any) {
      alumnosExistentesDocumentIds = [];
    }
    
    const nuevosAlumnos = [...alumnosExistentesDocumentIds, alumnoDocumentId];
    
    const response = await strapi.put<StrapiResponse<Apoderado>>(
      `etiquetas-apoderados/${apoderadoDocumentId}`,
      {
        alumnos: nuevosAlumnos,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error actualizando apoderado con alumno:", error);
    // No lanzamos el error, solo lo registramos, porque la relación ya está establecida desde el lado del alumno
    return null;
  }
}

