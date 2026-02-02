import { logger } from './helpers/logger';

// Validar variables de entorno solo en runtime, no durante el build
// Esto permite que Next.js haga el build sin requerir las variables
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    (process.env.NODE_ENV === 'production' && !process.env.STRAPI_API_TOKEN);

// Obtener variables directamente de process.env (Railway las inyecta aquí)
// Las variables del Dockerfile solo se usan si no hay variables reales
const NEXT_PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

/**
 * Valida que una cadena sea una URL válida
 */
function isValidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        // Debe ser http o https
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Valida el formato de las variables de entorno
 */
function validateEnvVarFormat(name: string, value: string): { valid: boolean; error?: string } {
    switch (name) {
        case 'NEXT_PUBLIC_STRAPI_URL':
            if (!value || value.trim() === '') {
                return { valid: false, error: 'NEXT_PUBLIC_STRAPI_URL no puede estar vacía' };
            }
            if (!isValidUrl(value)) {
                return { 
                    valid: false, 
                    error: 'NEXT_PUBLIC_STRAPI_URL debe ser una URL válida que comience con http:// o https://' 
                };
            }
            // Validar que no termine con barra diagonal
            if (value.endsWith('/')) {
                return { 
                    valid: false, 
                    error: 'NEXT_PUBLIC_STRAPI_URL no debe terminar con barra diagonal (/)' 
                };
            }
            return { valid: true };
            
        case 'STRAPI_API_TOKEN':
            if (!value || value.trim() === '') {
                return { valid: false, error: 'STRAPI_API_TOKEN no puede estar vacío' };
            }
            // Validar longitud mínima (tokens de Strapi suelen tener al menos 20 caracteres)
            if (value.length < 10) {
                return { 
                    valid: false, 
                    error: 'STRAPI_API_TOKEN debe tener al menos 10 caracteres' 
                };
            }
            // Validar que no contenga solo espacios
            if (value.trim().length === 0) {
                return { 
                    valid: false, 
                    error: 'STRAPI_API_TOKEN no puede contener solo espacios' 
                };
            }
            return { valid: true };
            
        default:
            return { valid: true };
    }
}

// Variables opcionales de SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_DEFAULT_FROM = process.env.SENDGRID_DEFAULT_FROM;
const SENDGRID_DEFAULT_REPLY_TO = process.env.SENDGRID_DEFAULT_REPLY_TO;

/** URL base pública de la app (sin barra final). Usar APP_BASE_URL en Railway/servidor para que el check.png se cargue en el correo. */
const APP_BASE_URL_RAW =
  process.env.APP_BASE_URL?.trim().replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') ||
  '';

const requiredEnvVars = {
    NEXT_PUBLIC_STRAPI_URL: NEXT_PUBLIC_STRAPI_URL,
    STRAPI_API_TOKEN: STRAPI_API_TOKEN,
};

// Solo validar en runtime, no durante el build
if (!isBuildTime) {
    const missingVars: string[] = [];
    const invalidFormatVars: Array<{ name: string; error: string }> = [];
    
    // Verificar variables faltantes
    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value || value.trim() === '') {
            missingVars.push(key);
        }
    }
    
    // Verificar formato de variables existentes
    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (value && value.trim() !== '') {
            const validation = validateEnvVarFormat(key, value);
            if (!validation.valid && validation.error) {
                invalidFormatVars.push({ name: key, error: validation.error });
            }
        }
    }
    
    // Reportar errores
    if (missingVars.length > 0) {
        logger.error('Faltan variables de entorno requeridas:', missingVars.join(', '));
        throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
    }
    
    if (invalidFormatVars.length > 0) {
        const errorMessages = invalidFormatVars.map(v => `${v.name}: ${v.error}`).join('; ');
        logger.error('Variables de entorno con formato inválido:', errorMessages);
        throw new Error(`Variables de entorno con formato inválido: ${errorMessages}`);
    }
}

export const env = {
    STRAPI_URL: NEXT_PUBLIC_STRAPI_URL || '',
    STRAPI_API_TOKEN: STRAPI_API_TOKEN || '',
    SENDGRID_API_KEY: SENDGRID_API_KEY || '',
    SENDGRID_DEFAULT_FROM: SENDGRID_DEFAULT_FROM || '',
    SENDGRID_DEFAULT_REPLY_TO: SENDGRID_DEFAULT_REPLY_TO || '',
    /** URL base de la app para enlaces e imágenes en emails (ej. https://tu-app.railway.app). Definir APP_BASE_URL o NEXT_PUBLIC_APP_URL en Railway. */
    APP_BASE_URL: APP_BASE_URL_RAW,
} as const;
