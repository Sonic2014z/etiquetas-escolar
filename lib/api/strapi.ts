/* API de Strapi */

import { env } from "@/lib/env";
import { logger } from "@/lib/helpers/logger";

/* Variables de entorno */

const STRAPI_URL = env.STRAPI_URL;
const STRAPI_TOKEN = env.STRAPI_API_TOKEN;

export function getStrapiURL(path = ""): string {
    const normalizedPath = path !== "" && !path.startsWith("/") ? `/${path}` : path;
    return `${STRAPI_URL}/api${normalizedPath}`;
}

/* Helpers */

// Timeout para requests a Strapi (30 segundos)
const STRAPI_TIMEOUT_MS = 30000;

/**
 * Crea un AbortController con timeout
 * Retorna el controller y una función para limpiar el timeout
 */
function createTimeoutController(timeoutMs: number): { controller: AbortController; cleanup: () => void } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const cleanup = () => clearTimeout(timeoutId);
    return { controller, cleanup };
}

interface StrapiErrorResponse {
    error?: {
        message?: string;
        details?: unknown;
    };
    message?: string;
}

async function fetchAPI<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: unknown,
    customHeaders?: HeadersInit,
): Promise<T> {
    // Validar que tenemos las variables de entorno necesarias
    if (!STRAPI_URL) {
        logger.error('[Strapi API] STRAPI_URL no está configurado');
        throw new Error('Configuración faltante: STRAPI_URL no está definida. Verifica las variables de entorno.');
    }
    
    if (!STRAPI_TOKEN) {
        logger.warn('[Strapi API] STRAPI_TOKEN no está configurado - las peticiones pueden fallar');
    }
    
    const requestUrl = getStrapiURL(path);
    logger.log(`[Strapi API] ${method} ${requestUrl}`);

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...customHeaders,
    };

    if (STRAPI_TOKEN) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${STRAPI_TOKEN}`;
    }
    
    // Crear AbortController con timeout
    const { controller, cleanup } = createTimeoutController(STRAPI_TIMEOUT_MS);
    
    const options: RequestInit = {
        method,
        headers,
        cache: "no-store",
        signal: controller.signal,
        ...(body ? { body: JSON.stringify(body) } : {}),
    };

    try {
        const response = await fetch(requestUrl, options);
        // Limpiar timeout si el request se completa exitosamente
        cleanup();

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as StrapiErrorResponse;
            // Log solo en desarrollo
            logger.error(`[Strapi API] Error response:`, {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            const errorMessage = errorData.error?.message || errorData.message || response.statusText;
            const errorDetails = errorData.error?.details ? JSON.stringify(errorData.error.details, null, 2) : '';
            throw new Error(`Error Strapi (${response.status}): ${errorMessage}${errorDetails ? `\nDetalles: ${errorDetails}` : ''}`);
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        // Limpiar timeout en caso de error
        cleanup();
        
        // Manejar errores de timeout específicamente
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Timeout: La solicitud a Strapi excedió el tiempo límite de ${STRAPI_TIMEOUT_MS / 1000} segundos`);
        }
        
        // Manejar errores de red
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
            logger.error(`[Strapi API] Error de conexión. URL: ${STRAPI_URL}, Path: ${path}`);
            throw new Error(`Error de conexión: No se pudo conectar con Strapi en ${STRAPI_URL}. Verifica que la URL sea correcta y que Strapi esté accesible.`);
        }
        
        // Log solo en desarrollo
        logger.error(`[Strapi API] Error en ${method} ${path}:`, error);
        throw error;
    }
}

/* CLiente Strapi exportable */

export const strapi = {
    get: <T>(path: string, headers?: HeadersInit) => fetchAPI<T>(path, "GET", undefined, headers),
    post: <T>(path: string, data: unknown, headers?: HeadersInit) => fetchAPI<T>(path, "POST", { data }, headers),
    put: <T>(path: string, data: unknown, headers?: HeadersInit) => fetchAPI<T>(path, "PUT", { data }, headers),
}