import { strapi } from "./strapi";
import type { EtiquetaQR, StrapiResponse, StrapiCollectionResponse } from "@/types/strapi";
import { logger } from "@/lib/helpers/logger";

/**
 * Busca un QR code por hash
 */
export async function findQRByHash(hash: string): Promise<EtiquetaQR | null> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaQR>>(
      `etiquetas-qr?filters[hash][$eq]=${encodeURIComponent(hash)}`
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    logger.error("Error buscando QR por hash:", error);
    throw error;
  }
}

/**
 * Crea un nuevo QR code en Strapi
 */
export async function createQRCode(data: {
  hash: string;
  nombreAlumno: string;
  cursoAlumno: string;
  telefonoApoderado: string;
  nombreApoderado: string;
}): Promise<EtiquetaQR> {
  try {
    const payload = {
      hash: data.hash,
      nombreAlumno: data.nombreAlumno,
      cursoAlumno: data.cursoAlumno,
      telefonoApoderado: data.telefonoApoderado,
      nombreApoderado: data.nombreApoderado,
    };
    
    logger.log("Creando QR code en Strapi:", { hash: data.hash, nombreAlumno: data.nombreAlumno });
    
    const response = await strapi.post<StrapiResponse<EtiquetaQR>>(
      "etiquetas-qr",
      payload
    );
    
    if (!response.data || (!response.data.id && !response.data.documentId)) {
      logger.error("Strapi no devolvió ID al crear QR code:", response);
      throw new Error("Error: Strapi no devolvió ID al crear QR code");
    }
    
    logger.log("QR code creado exitosamente:", response.data.documentId || response.data.id);
    return response.data;
  } catch (error) {
    logger.error("Error creando QR code:", error);
    if (error instanceof Error) {
      // Si es un error 405, podría ser el mismo problema que con etiquetas-pdf
      if (error.message.includes('405') || error.message.includes('Method Not Allowed')) {
        logger.error("ERROR 405 en etiquetas-qr: El Content Type podría no estar disponible para la API Key");
        logger.error("Verifica en Strapi que 'etiquetas-qr' esté en los permisos de tu API Key");
      }
    }
    throw error;
  }
}

/**
 * Crea o actualiza un QR code (upsert)
 * Si existe, lo actualiza; si no, lo crea
 */
export async function upsertQRCode(data: {
  hash: string;
  nombreAlumno: string;
  cursoAlumno: string;
  telefonoApoderado: string;
  nombreApoderado: string;
}): Promise<EtiquetaQR> {
  try {
    // Primero intentar buscar si existe
    const existing = await findQRByHash(data.hash);
    
    if (existing) {
      // Si existe, actualizar usando documentId
      const response = await strapi.put<StrapiResponse<EtiquetaQR>>(
        `etiquetas-qr/${existing.documentId}`,
        {
          nombreAlumno: data.nombreAlumno,
          cursoAlumno: data.cursoAlumno,
          telefonoApoderado: data.telefonoApoderado,
          nombreApoderado: data.nombreApoderado,
        }
      );
      
      return response.data;
    } else {
      // Si no existe, crear nuevo
      return await createQRCode(data);
    }
  } catch (error) {
    logger.error("Error en upsert QR code:", error);
    throw error;
  }
}
