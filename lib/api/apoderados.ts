import { strapi } from "./strapi";
import type { Apoderado, StrapiCollectionResponse, StrapiResponse } from "@/types/strapi";

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
): Promise<Apoderado> {
  try {
    // Primero obtenemos el apoderado con sus alumnos actuales
    const apoderadoResponse = await strapi.get<StrapiResponse<Apoderado>>(
      `etiquetas-apoderados/${apoderadoId}?populate=alumnos`
    );
    
    const apoderado = apoderadoResponse.data;
    const alumnosExistentes = apoderado.attributes.alumnos?.data || [];
    
    // Verificamos que el alumno no esté ya relacionado
    const yaRelacionado = alumnosExistentes.some((a) => a.id === alumnoId);
    if (yaRelacionado) {
      return apoderado;
    }
    
    // Agregamos el nuevo alumno a la lista
    // En Strapi v4, para relaciones many-to-many o one-to-many, podemos pasar un array de IDs
    const nuevosAlumnos = [...alumnosExistentes.map((a) => a.id), alumnoId];
    
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
    throw error;
  }
}

