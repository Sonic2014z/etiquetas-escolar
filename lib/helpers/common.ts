/* Funciones auxiliares comunes y reutilizables en la aplicación. */

export function formatChileanPhone(phone: string): string {
    // Verificación básica:
    if (!phone) return '';
    
    // Limpiamos el teléfono:
    let clean = phone.replace(/\D/g, '');

    // Normalizamos el teléfono:

    // Caso A: EL usuario escribió 8 digitos (ej: 91234567), por ende asumimos que es un número móvil y falta el 569.
    if (clean.length === 8) {
        clean = '569' + clean;
    // Caso B: EL usuario escribió 9 digitos (ej: 976543210), por ende asumimos que le falta el código de país 56.
    } else if (clean.length === 9) {
        clean = '56' + clean;
    }

    // Formateamos visualmente el teléfono:
    if (clean.length === 11 && clean.startsWith('56')) {
        return `+${clean.slice(0, 2)} ${clean.slice(2, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
    }

    // Si este no cumple con el formato estándar chileno, devolvemos el teléfono limpio.

    return clean;
}

export function getWhatsAppNumber(phone: string): string {
    // Reutilizamos la lógica anterior pero devolvemos solo números limpios.
    let clean = phone.replace(/\D/g, '');

    if (clean.length === 8) clean = '569' + clean;
    if (clean.length === 9) clean = '56' + clean;

    return clean; // Retorna ej: "56912345678" (Adaptado para la API de WhatsApp)
}

export function capitalizeFirstLetter(str: string): string {
    // Verificación básica:
    if (!str) return '';

    return str
    .toLowerCase()
    .split(' ')
    .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' '); // Ej: "juan pérez" -> "Juan Pérez"
}

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
 * Normaliza texto para búsquedas: quita acentos, convierte a minúsculas y elimina espacios extra
 * Útil para hacer búsquedas más flexibles que ignoren acentos y mayúsculas
 * @param text - Texto a normalizar
 * @returns Texto normalizado
 */
export function normalizeSearchText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .toLowerCase()
        .normalize('NFD') // Descompone caracteres con acentos
        .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (acentos)
        .trim() // Elimina espacios al inicio y final
        .replace(/\s+/g, ' '); // Reemplaza múltiples espacios por uno solo
}