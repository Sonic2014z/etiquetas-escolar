export function validateRut(rut: string): boolean {
    // Verificación básica: debe ser un string y no estar vacío.
    if (!rut || typeof rut !== 'string') return false;

    // Eliminamos puntos, guiones y/o espacios.
    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    // Verificación básica: debe tener al menos 2 caracteres (número + DV).
    if (cleanRut.length < 2) return false;

    // Separamos el cuerpo del RUT (números) y el DV (caracter).
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Verificación básica: el cuerpo debe contener solo números.
    if (!/^[0-9]+$/.test(body)) return false;
    
    // Inicializamos la suma y el multiplicador.
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length -1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        
        // El multiplicador aumenta: 2, 3, 4, 5... y si llega a 7 se reinicia a 2.
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    // Fórmula del Módulo 11:
    // Calculamos el resto de dividir la suma por 11 y se lo restamos a 11.
    const res = 11 - (sum % 11);

    // Convertimos el resultado númerico a caracter:
    let calculatedDv: string;
    if (res === 11) {
        calculatedDv = '0'; // Si el resultado es 11 el DV es 0.
    } else if (res === 10) {
        calculatedDv = 'K'; // Si el resultado es 10 el DV es K.
    } else {
        calculatedDv = res.toString(); // Si el resultado es un número lo convertimos a string.
    }

    return dv === calculatedDv; // Verifica si el DV calculado coincide con el DV original.
}