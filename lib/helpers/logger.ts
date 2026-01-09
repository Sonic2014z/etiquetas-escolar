/**
 * Utilidad para logging condicional
 * Solo muestra logs en desarrollo, en producción se silencian
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
    // En producción, podrías enviar a un servicio de logging como Sentry
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },
};
