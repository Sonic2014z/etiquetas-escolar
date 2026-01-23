import { strapi } from "./strapi";
import type { Apoderado, StrapiCollectionResponse, StrapiResponse } from "@/types/strapi";
import { logger } from "@/lib/helpers/logger";

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
    logger.error("Error verificando apoderado por ID:", error);
    throw error;
  }
}

/**
 * Obtiene un apoderado por documentId
 */
export async function getApoderadoByDocumentId(documentId: string): Promise<Apoderado | null> {
  try {
    const response = await strapi.get<StrapiResponse<Apoderado>>(
      `etiquetas-apoderados/${documentId}`
    );
    
    return response.data || null;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      return null;
    }
    logger.error("Error obteniendo apoderado por documentId:", error);
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
    logger.error("Error buscando apoderado por RUT:", error);
    throw error;
  }
}

/**
 * Busca un apoderado por teléfono
 */
export async function findApoderadoByTelefono(telefono: string): Promise<Apoderado | null> {
  try {
    const cleanTelefono = telefono.replace(/\s+/g, '').trim();
    const response = await strapi.get<StrapiCollectionResponse<Apoderado>>(
      `etiquetas-apoderados?filters[telefono][$eq]=${encodeURIComponent(cleanTelefono)}&populate=alumnos`
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    logger.error("Error buscando apoderado por teléfono:", error);
    throw error;
  }
}

/**
 * Busca un apoderado por email
 */
export async function findApoderadoByEmail(email: string): Promise<Apoderado | null> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const response = await strapi.get<StrapiCollectionResponse<Apoderado>>(
      `etiquetas-apoderados?filters[email][$eq]=${encodeURIComponent(cleanEmail)}&populate=alumnos`
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    logger.error("Error buscando apoderado por email:", error);
    throw error;
  }
}

/**
 * Busca un apoderado por múltiples criterios (RUT, teléfono, email)
 * Retorna el primer apoderado encontrado con cualquiera de estos criterios
 */
export async function findApoderadoByCriterios(data: {
  rut?: string;
  telefono?: string;
  email?: string;
}): Promise<Apoderado | null> {
  try {
    // Prioridad: RUT > Teléfono > Email
    if (data.rut && data.rut.trim()) {
      const apoderado = await findApoderadoByRut(data.rut);
      if (apoderado) {
        logger.log('Apoderado encontrado por RUT');
        return apoderado;
      }
    }
    
    if (data.telefono && data.telefono.trim()) {
      const apoderado = await findApoderadoByTelefono(data.telefono);
      if (apoderado) {
        logger.log('Apoderado encontrado por teléfono');
        return apoderado;
      }
    }
    
    if (data.email && data.email.trim()) {
      const apoderado = await findApoderadoByEmail(data.email);
      if (apoderado) {
        logger.log('Apoderado encontrado por email');
        return apoderado;
      }
    }
    
    return null;
  } catch (error) {
    logger.error("Error buscando apoderado por criterios:", error);
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
    // Limpiar RUT solo si está presente, si no, enviar string vacío
    const cleanRut = data.rut && data.rut.trim() 
      ? data.rut.replace(/[^0-9kK]/g, '') 
      : "";
    
    const payload: any = {
      nombres: data.nombres,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido || "",
      rut: cleanRut,
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
    logger.error("Error creando apoderado:", error);
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
    logger.error("Error actualizando apoderado con alumno:", error);
    // No lanzamos el error, solo lo registramos, porque la relación ya está establecida desde el lado del alumno
    return null;
  }
}

