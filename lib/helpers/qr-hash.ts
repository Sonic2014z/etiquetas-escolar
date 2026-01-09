/**
 * Utilidades para generar y manejar hashes de QR codes
 */

import { createHash } from 'crypto';

/**
 * Datos necesarios para regenerar la URL de WhatsApp
 */
export interface QRData {
  studentName: string;
  studentGrade: string;
  parentPhone: string;
  parentName: string;
}

/**
 * Genera un hash determinístico largo a partir de los datos del QR
 * Este hash permite regenerar la URL de WhatsApp sin almacenar datos
 */
export function generateQRHash(data: QRData): string {
  // Crear un string único con los datos (orden consistente)
  const dataString = JSON.stringify({
    n: data.studentName.trim().toLowerCase(),
    g: data.studentGrade.trim().toLowerCase(),
    p: data.parentPhone.replace(/\D/g, ''), // Solo números
    a: data.parentName.trim().toLowerCase(),
  });
  
  // Generar hash SHA-256 y tomar los primeros 16 caracteres
  const hash = createHash('sha256').update(dataString).digest('hex');
  return hash.substring(0, 16);
}

/**
 * Regenera la URL de WhatsApp a partir de los datos
 */
export function regenerateWhatsAppUrl(data: QRData): string {
  const { getWhatsAppNumber } = require('@/lib/helpers/common');
  
  // Limpiar y normalizar el teléfono
  const whatsappNumber = getWhatsAppNumber(data.parentPhone);
  
  if (whatsappNumber.length !== 11) {
    throw new Error('Invalid phone number');
  }
  
  // Construir el mensaje
  const message = `Hola ${data.parentName}, encontré un útil escolar perteneciente a ${data.studentName} del curso ${data.studentGrade}.`;
  
  // Generar URL de WhatsApp
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Codifica un string de forma compacta para usar en URLs
 */
function compactEncode(str: string): string {
  // Usar base64 y remover padding, luego hacer URL-safe
  const encoded = Buffer.from(str).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return encoded;
}

/**
 * Genera una URL intermediaria muy corta para el QR code
 * @param data - Datos del estudiante y apoderado
 * @param baseUrl - La URL base de la aplicación
 * @returns URL intermediaria muy corta (solo hash de 8 caracteres)
 */
export function generateIntermediateQRUrl(data: QRData, baseUrl?: string): string {
  // Generar hash determinístico muy corto (8 caracteres)
  const hash = generateQRHash(data).substring(0, 8);
  
  // Determinar la URL base:
  // 1. Usar baseUrl si se proporciona
  // 2. Si no, usar variable de entorno NEXT_PUBLIC_APP_URL
  // 3. Si no, usar window.location.origin (solo en cliente)
  let origin = baseUrl;
  if (!origin && typeof window !== 'undefined') {
    origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  
  // Si aún no hay origin, usar string vacío (se generará relativa)
  if (!origin) {
    origin = '';
  }
  
  // URL muy corta: solo el hash
  return `${origin}/qr/${hash}`;
}
