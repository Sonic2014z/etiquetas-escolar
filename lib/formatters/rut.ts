/* Utilidades para la manipulación y formate de RUTs chilenos para la presentación en la interfaz. */	

// Función para limpiar el RUT:
export function cleanRUT(rut: string): string {
    if (!rut || typeof rut !== 'string') return '';

    // Devuelve el RUT sin puntos, guiones y/o espacios.
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

// Función para formatear el RUT:
export function formatRut(rut: string): string {
    const clean = cleanRUT(rut);

    // Si el RUT es muy corto, devolvemos el RUT limpio.
    if (clean.length <= 1) return clean;

    // Separamos el cuerpo y DV del RUT.
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Agregamos puntos al cuerpo con el RegEx de 3 en 3 caracteres.
    const bodyFormatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Devolvemos el RUT formateado con el DV al final.
    return `${bodyFormatted}-${dv}`;
}

// Función para obtener el dígito verificador del RUT:
export function getRutDv(rut: string): string {
    const clean = cleanRUT(rut);
    // Devolvemos el DV del RUT.
    return clean.slice(-1);
}

// Función para obtener solo el número del RUT:
export function getRutNumber(rut: string): string {
    const clean = cleanRUT(rut);
    // Devolvemos el número del RUT.
    return clean.slice(0, -1);
}

export function formatRutOnType(rut: string): string {
    // Esta función se encarga de formatear el RUT mientras el usuario lo ingresa.

    const clean = cleanRUT(rut);

    // Si el usuario borra todo, devolvemos un string vacío.
    if (clean.length === 0) return '';

    // Formateamos el RUT mientras el usuario lo ingresa.
    return formatRut(clean);
}