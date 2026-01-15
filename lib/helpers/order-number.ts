import { strapi } from '@/lib/api/strapi';
import { logger } from '@/lib/helpers/logger';

/**
 * Verifica si un número de orden ya existe en Strapi.
 */
export async function orderNumberExists(orderNumber: string): Promise<boolean> {
  try {
    const response = await strapi.get<{
      data: Array<{ numero_orden: number }>;
    }>(`etiquetas-pdf?filters[numero_orden][$eq]=${orderNumber}&pagination[pageSize]=1`);

    return response.data && response.data.length > 0;
  } catch (error) {
    logger.error(`Error verificando si el número de orden ${orderNumber} existe:`, error);
    // En caso de error, asumir que no existe para intentar crearlo y que el error se maneje en la creación
    return false;
  }
}

/**
 * Genera el siguiente número de orden secuencial para el año actual.
 * Formato: YYNNNNNNN (9 dígitos: últimos 2 dígitos del año + 7 dígitos de contador)
 * El año se almacena por separado en el campo año_escolar
 * Ejemplo para 2026: 260000001, 260000002, 260000003, ... 269999999
 */
export async function generateSequentialOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // Últimos 2 dígitos del año (ej: "26" para 2026)
  const yearPrefixNum = parseInt(yearSuffix); // Número del año (ej: 26)

  try {
    // Buscar números de orden del año actual, ordenados descendente
    const response = await strapi.get<{
      data: Array<{ numero_orden: number; año_escolar: number }>;
    }>(`etiquetas-pdf?filters[año_escolar][$eq]=${currentYear}&sort[0]=numero_orden:desc&pagination[pageSize]=100`);

    const orders = response.data || [];
    
    // Buscar el último número válido que tenga el formato YYNNNNNNN y coincida con el año actual
    let lastValidOrder = null;
    let lastCounter = 0;
    
    for (const order of orders) {
      if (order.numero_orden) {
        const orderString = order.numero_orden.toString();
        
        // Si tiene 9 dígitos, extraer el año y el contador
        if (orderString.length === 9) {
          const orderYearPrefix = parseInt(orderString.substring(0, 2));
          const orderCounter = parseInt(orderString.substring(2));
          
          // Verificar que el año coincida y el contador sea válido
          if (orderYearPrefix === yearPrefixNum && orderCounter > 0 && orderCounter <= 9999999) {
            lastValidOrder = order;
            lastCounter = orderCounter;
            break;
          }
        }
        // Si tiene menos de 9 dígitos, podría ser un número antiguo sin formato YY
        // Lo ignoramos y continuamos buscando
      }
    }

    if (lastValidOrder && lastCounter > 0) {
      const nextCounter = lastCounter + 1;

      // Verificar que no exceda el límite del contador (9999999)
      if (nextCounter > 9999999) {
        logger.warn('Número de orden excedería el límite del contador, reiniciando desde 1 para el año actual', {
          último_contador: lastCounter,
          año: currentYear,
        });
        // Reiniciar desde 1 si se alcanzaría el límite
        return `${yearSuffix}0000001`;
      }

      // Generar nuevo número: YY + contador con padding de 7 dígitos
      const newOrderNumber = `${yearSuffix}${nextCounter.toString().padStart(7, '0')}`;

      logger.log('Número de orden generado secuencialmente', {
        año: currentYear,
        año_sufijo: yearSuffix,
        último_contador: lastCounter,
        nuevo_contador: nextCounter,
        nuevo_número: newOrderNumber,
      });

      return newOrderNumber;
    }

    // Si no hay registros válidos del año actual, empezar desde 1
    if (orders.length > 0) {
      logger.warn('No se encontraron números de orden con formato YYNNNNNNN para el año actual, iniciando secuencia', {
        año: currentYear,
        año_sufijo: yearSuffix,
        total_registros: orders.length,
      });
    }

    const firstOrderNumber = `${yearSuffix}0000001`;

    logger.log('Primer número de orden del año generado', {
      año: currentYear,
      año_sufijo: yearSuffix,
      número: firstOrderNumber,
    });

    return firstOrderNumber;
  } catch (error) {
    // En caso de error, generar un número basado en timestamp como fallback
    logger.error('Error generando número de orden secuencial, usando fallback', error);

    // Fallback: usar año + timestamp mod 9999999
    const timestamp = Date.now();
    const fallbackCounter = ((timestamp % 9999999) + 1).toString().padStart(7, '0');
    const fallbackNumber = `${yearSuffix}${fallbackCounter}`;

    return fallbackNumber;
  }
}

/**
 * Genera un número de orden único, reintentando si encuentra duplicados.
 */
export async function generateUniqueOrderNumber(maxAttempts: number = 10): Promise<string> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const newOrderNumber = await generateSequentialOrderNumber();
    const exists = await orderNumberExists(newOrderNumber);

    if (!exists) {
      logger.log(`Número de orden único generado: ${newOrderNumber} después de ${attempts + 1} intento(s)`);
      return newOrderNumber;
    }

    logger.warn(`Número de orden ${newOrderNumber} ya existe, reintentando... (Intento ${attempts + 1}/${maxAttempts})`);
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa para evitar condiciones de carrera
  }

  logger.error(`No se pudo generar un número de orden único después de ${maxAttempts} intentos.`);
  throw new Error('No se pudo generar un número de orden único.');
}
