/**
 * Genera un UID único para los apoderados
 * Formato: prefijo + timestamp + random string
 */
export function generateUID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `APD-${timestamp}-${randomPart}`.toUpperCase();
}

