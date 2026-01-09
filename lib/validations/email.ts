/**
 * Validación de formato de email usando regex
 * Valida el formato básico del email (usuario@dominio.extension)
 */

/**
 * Valida el formato de un email
 * @param email - Email a validar
 * @returns true si el formato es válido, false en caso contrario
 */
export function validateEmail(email: string): boolean {
  // Si el email está vacío o es solo espacios, es válido (campo opcional)
  if (!email || email.trim() === '') {
    return true;
  }
  
  // Regex para validar formato básico de email
  // Formato: usuario@dominio.extension
  // - usuario: puede contener letras, números, puntos, guiones, guiones bajos, y signos + y %
  // - dominio: puede contener letras, números, puntos y guiones
  // - extension: debe tener al menos 2 letras (ej: .com, .cl, .org)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(email.trim());
}

/**
 * Valida el formato de un email y retorna un mensaje de error si es inválido
 * @param email - Email a validar
 * @returns Objeto con valid: boolean y error?: string
 */
export function validateEmailWithMessage(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: true }; // Campo opcional, vacío es válido
  }
  
  if (!validateEmail(email)) {
    return { 
      valid: false, 
      error: 'El formato del email no es válido. Debe tener el formato: usuario@dominio.com' 
    };
  }
  
  return { valid: true };
}
