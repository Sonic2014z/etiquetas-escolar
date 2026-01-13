import { strapi } from "./strapi";
import type { EtiquetaPDF, StrapiResponse, StrapiCollectionResponse } from "@/types/strapi";
import { logger } from "@/lib/helpers/logger";

/**
 * Busca PDFs por hash QR
 */
export async function findPDFByHash(hash: string): Promise<EtiquetaPDF | null> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[hash_qr][$eq]=${encodeURIComponent(hash)}&populate=*`
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error: unknown) {
    logger.error("Error buscando PDF por hash:", error);
    throw error;
  }
}

/**
 * Busca PDFs por apoderado (documentId)
 */
export async function findPDFsByApoderado(apoderadoDocumentId: string): Promise<EtiquetaPDF[]> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[apoderado][documentId][$eq]=${encodeURIComponent(apoderadoDocumentId)}&populate=*`
    );

    return response.data || [];
  } catch (error: unknown) {
    logger.error("Error buscando PDFs por apoderado:", error);
    throw error;
  }
}

/**
 * Busca PDFs por alumno (documentId)
 */
export async function findPDFsByAlumno(alumnoDocumentId: string): Promise<EtiquetaPDF[]> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[alumno][documentId][$eq]=${encodeURIComponent(alumnoDocumentId)}&populate=*`
    );

    return response.data || [];
  } catch (error: unknown) {
    logger.error("Error buscando PDFs por alumno:", error);
    throw error;
  }
}

/**
 * Busca PDFs por año escolar
 */
export async function findPDFsByAño(añoEscolar: number): Promise<EtiquetaPDF[]> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[año_escolar][$eq]=${añoEscolar}&populate=*`
    );

    return response.data || [];
  } catch (error: unknown) {
    logger.error("Error buscando PDFs por año:", error);
    throw error;
  }
}

/**
 * Crea un nuevo registro de PDF en Strapi
 * NOTA: Para subir el archivo PDF, necesitas usar FormData desde una API route
 * Esta función solo crea el registro sin el archivo
 */
export async function createPDFRecord(data: {
  apoderado: string; // documentId
  alumno: string; // documentId
  hash_qr: string;
  numero_orden: number; // Integer según tu schema
  año_escolar: number;
  colegio_nombre: string; // Required según tu schema
  estado?: 'generado' | 'impreso' | 'archivado';
}): Promise<EtiquetaPDF> {
  try {
    const payload = {
      apoderado: data.apoderado,
      alumno: data.alumno,
      hash_qr: data.hash_qr,
      numero_orden: data.numero_orden,
      año_escolar: data.año_escolar,
      colegio_nombre: data.colegio_nombre,
      estado: data.estado || 'generado',
    };

    const response = await strapi.post<StrapiResponse<EtiquetaPDF>>(
      "etiquetas-pdf",
      payload
    );

    if (!response.data || !response.data.documentId) {
      throw new Error("Error: Strapi no devolvió documentId al crear PDF");
    }

    return response.data;
  } catch (error: unknown) {
    logger.error("Error creando registro de PDF:", error);
    throw error;
  }
}

/**
 * Actualiza el estado de un PDF
 */
export async function updatePDFEstado(documentId: string, estado: 'generado' | 'impreso' | 'archivado'): Promise<EtiquetaPDF> {
  try {
    const response = await strapi.put<StrapiResponse<EtiquetaPDF>>(
      `etiquetas-pdf/${documentId}`,
      {
        estado: estado,
      }
    );

    return response.data;
  } catch (error: unknown) {
    logger.error("Error actualizando estado de PDF:", error);
    throw error;
  }
}
