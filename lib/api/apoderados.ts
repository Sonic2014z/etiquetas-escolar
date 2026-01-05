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
    
    if (response.data) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    // Si es 404, el apoderado no existe
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
    
    // Solo agregar email si tiene valor, de lo contrario no lo enviamos (o enviamos null si Strapi lo requiere)
    if (data.email && data.email.trim() !== "") {
      payload.email = data.email;
    } else {
      // Si el campo es requerido en Strapi pero puede ser null, enviamos null
      // Si no es requerido, simplemente no lo incluimos
      payload.email = null;
    }
    
    console.log("[createApoderado] Payload enviado:", JSON.stringify(payload, null, 2));
    
    const response = await strapi.post<StrapiResponse<Apoderado>>(
      "etiquetas-apoderados",
      payload
    );
    
    console.log("[createApoderado] Respuesta completa:", JSON.stringify(response, null, 2));
    console.log("[createApoderado] ID extraído:", response.data?.id);
    
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
  apoderadoId: number,
  alumnoId: number
): Promise<Apoderado | null> {
  try {
    // Intentamos obtener el apoderado con sus alumnos actuales
    let alumnosExistentes: number[] = [];
    
    try {
      const apoderadoResponse = await strapi.get<StrapiResponse<Apoderado>>(
        `etiquetas-apoderados/${apoderadoId}?populate=alumnos`
      );
      
      const apoderado = apoderadoResponse.data;
      alumnosExistentes = apoderado.attributes.alumnos?.data?.map((a) => a.id) || [];
      
      // Verificamos que el alumno no esté ya relacionado
      if (alumnosExistentes.includes(alumnoId)) {
        console.log(`Alumno ${alumnoId} ya está relacionado con apoderado ${apoderadoId}`);
        return apoderado;
      }
    } catch (getError: any) {
      // Si no podemos obtener el apoderado, continuamos de todas formas
      // Esto puede pasar si el endpoint no está disponible o hay un problema de permisos
      console.warn(`No se pudo obtener apoderado ${apoderadoId}, continuando con actualización directa:`, getError.message);
      alumnosExistentes = [];
    }
    
    // Agregamos el nuevo alumno a la lista
    // En Strapi v4, para relaciones many-to-many o one-to-many, podemos pasar un array de IDs
    const nuevosAlumnos = [...alumnosExistentes, alumnoId];
    
    console.log(`[updateApoderadoWithAlumno] Actualizando apoderado ${apoderadoId} con alumnos:`, nuevosAlumnos);
    
    // Actualizamos el apoderado
    const response = await strapi.put<StrapiResponse<Apoderado>>(
      `etiquetas-apoderados/${apoderadoId}`,
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

