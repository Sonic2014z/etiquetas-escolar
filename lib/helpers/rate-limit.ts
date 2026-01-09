/**
 * Rate limiting simple en memoria para APIs
 * En producción, considera usar Redis o un servicio dedicado
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Almacenamiento en memoria (Map)
// En producción, usa Redis o similar para escalabilidad
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Configuración de rate limiting
 */
const RATE_LIMIT_CONFIG = {
  // Número máximo de requests por ventana de tiempo
  maxRequests: 10,
  // Ventana de tiempo en milisegundos (ej: 60000 = 1 minuto)
  windowMs: 60000, // 1 minuto
  // Tiempo de bloqueo después de exceder el límite (en milisegundos)
  blockDurationMs: 300000, // 5 minutos
};

/**
 * Limpia entradas expiradas del store
 */
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Obtiene la clave de rate limiting basada en IP
 */
function getRateLimitKey(identifier: string): string {
  return `rate_limit:${identifier}`;
}

/**
 * Verifica si un request está dentro del límite de rate
 * @param identifier - Identificador único (IP, user ID, etc.)
 * @returns true si está dentro del límite, false si excedió
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  // Limpiar entradas expiradas periódicamente
  if (Math.random() < 0.1) { // 10% de probabilidad de limpiar
    cleanExpiredEntries();
  }

  const key = getRateLimitKey(identifier);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Si no hay entrada o expiró, crear nueva
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Si excedió el límite, verificar si está bloqueado
  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    // Si aún está en el período de bloqueo, denegar
    if (entry.resetTime > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }
    // Si el bloqueo expiró, reiniciar contador
    entry.count = 1;
    entry.resetTime = now + RATE_LIMIT_CONFIG.windowMs;
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Incrementar contador
  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Obtiene el IP del request
 */
export function getRequestIP(request: Request): string {
  // Intentar obtener IP de headers comunes
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback: usar un identificador genérico
  return 'unknown';
}
