import fs from 'fs/promises';
import path from 'path';
import sgMail from '@sendgrid/mail';
import { logger } from '@/lib/helpers/logger';
import { env } from '@/lib/env';
import {
  buildConfirmacionEnvioHtml,
  buildConfirmacionEnvioText,
} from '@/lib/api/email-templates';

/**
 * Devuelve la URL o data URI del icono de check para el correo.
 * Prioridad: 1) URL pública (APP_BASE_URL/check.png) — la única fiable en Gmail/Outlook.
 *            2) data URI (muchos clientes la bloquean).
 */
async function getCheckIconSrc(): Promise<string> {
  if (env.APP_BASE_URL && env.APP_BASE_URL.startsWith('http')) {
    const url = `${env.APP_BASE_URL}/check.png`;
    logger.log(`Correo: usando icono check desde URL (verifica en el navegador que cargue): ${url}`);
    return url;
  }
  try {
    const filePath = path.join(process.cwd(), 'public', 'check.png');
    const buf = await fs.readFile(filePath);
    logger.log('Correo: usando icono check en data URI (algunos clientes de correo la bloquean).');
    return 'data:image/png;base64,' + buf.toString('base64');
  } catch (e) {
    logger.warn('No se pudo cargar public/check.png para el correo, se usará icono SVG por defecto.', e);
    return '';
  }
}

/**
 * Configura SendGrid con la API Key
 */
export function initializeSendGrid() {
  const apiKey = env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn('SENDGRID_API_KEY no está configurada. El envío de emails estará deshabilitado.');
    return false;
  }
  
  sgMail.setApiKey(apiKey);
  return true;
}

/**
 * Envía un email con un PDF adjunto usando SendGrid (diseño "envío a domicilio").
 *
 * @param to - Email del destinatario (apoderado)
 * @param pdfBuffer - Buffer del PDF a adjuntar
 * @param studentName - Nombre del estudiante para personalizar el email
 * @param orderNumber - Número de orden para incluir en el asunto
 * @param guardianName - Nombre del apoderado para el saludo (opcional)
 */
export async function sendEmailWithPDF(
  to: string,
  pdfBuffer: Buffer,
  studentName: string,
  orderNumber: string,
  guardianName?: string
): Promise<boolean> {
  try {
    if (!env.SENDGRID_API_KEY) {
      logger.warn('SENDGRID_API_KEY no está configurada. No se puede enviar email.');
      return false;
    }
    if (!env.SENDGRID_DEFAULT_FROM) {
      logger.warn('SENDGRID_DEFAULT_FROM no está configurada. No se puede enviar email.');
      return false;
    }
    initializeSendGrid();
    if (!to || !to.trim() || !to.includes('@')) {
      logger.warn(`Email del destinatario inválido: ${to}`);
      return false;
    }

    const pdfFilename = `etiquetas_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${orderNumber}.pdf`;
    const checkIconSrc = await getCheckIconSrc();
    const html = buildConfirmacionEnvioHtml({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber,
      attachmentFilenames: [pdfFilename],
      ...(checkIconSrc && { checkIconSrc }),
    });
    const text = buildConfirmacionEnvioText({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber,
      attachmentFilenames: [pdfFilename],
    });

    const msg: any = {
      to: to.trim(),
      from: env.SENDGRID_DEFAULT_FROM,
      subject: `Etiquetas Escolares - ${studentName} (Orden #${orderNumber})`,
      ...(env.SENDGRID_DEFAULT_REPLY_TO && { replyTo: env.SENDGRID_DEFAULT_REPLY_TO }),
      html,
      text,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: pdfFilename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    await sgMail.send(msg);
    logger.log(`Email enviado exitosamente a ${to} para el estudiante ${studentName}`);
    return true;
  } catch (error) {
    logger.error('Error enviando email con SendGrid:', error);
    if (error instanceof Error) {
      logger.error(`Error details: ${error.message}`);
    }
    return false;
  }
}

/**
 * Envía un solo email con múltiples PDFs adjuntos (uno por alumno). Diseño "envío a domicilio".
 *
 * @param to - Email del destinatario (apoderado)
 * @param orderNumbers - Lista de números de orden asociados a los PDFs
 * @param attachments - Arreglo de buffers + nombre de estudiante por cada PDF
 * @param guardianName - Nombre del apoderado para el saludo (opcional)
 */
export async function sendEmailWithMultiplePDFs(
  to: string,
  orderNumbers: string[],
  attachments: { pdfBuffer: Buffer; studentName: string }[],
  guardianName?: string
): Promise<boolean> {
  try {
    if (!env.SENDGRID_API_KEY) {
      logger.warn('SENDGRID_API_KEY no está configurada. No se puede enviar email.');
      return false;
    }
    if (!env.SENDGRID_DEFAULT_FROM) {
      logger.warn('SENDGRID_DEFAULT_FROM no está configurada. No se puede enviar email.');
      return false;
    }
    initializeSendGrid();
    if (!to || !to.trim() || !to.includes('@')) {
      logger.warn(`Email del destinatario inválido: ${to}`);
      return false;
    }
    if (!attachments || attachments.length === 0) {
      logger.warn('sendEmailWithMultiplePDFs llamado sin adjuntos');
      return false;
    }

    const cleanedOrderNumbers = Array.from(
      new Set(
        (orderNumbers || [])
          .map((n) => (n ?? '').toString().trim())
          .filter((n) => n.length > 0)
      )
    );
    const mainOrderNumber = cleanedOrderNumbers[0] || 'varios';

    const attachmentFilenames = attachments.map((att, idx) => {
      const order = orderNumbers[idx] || mainOrderNumber;
      const safeName = att.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'alumno';
      return `etiquetas_${safeName}_${order || 'orden'}.pdf`;
    });

    const checkIconSrc = await getCheckIconSrc();
    const html = buildConfirmacionEnvioHtml({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber: mainOrderNumber,
      attachmentFilenames,
      ...(checkIconSrc && { checkIconSrc }),
    });
    const text = buildConfirmacionEnvioText({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber: mainOrderNumber,
      attachmentFilenames,
    });

    const subject =
      attachments.length === 1
        ? `Etiquetas Escolares - ${attachments[0].studentName} (Orden #${mainOrderNumber})`
        : `Etiquetas Escolares - ${attachments.length} alumnos (Órdenes #${cleanedOrderNumbers.join(', ') || mainOrderNumber})`;

    const msg: any = {
      to: to.trim(),
      from: env.SENDGRID_DEFAULT_FROM,
      subject,
      ...(env.SENDGRID_DEFAULT_REPLY_TO && { replyTo: env.SENDGRID_DEFAULT_REPLY_TO }),
      html,
      text,
      attachments: attachments.map((att, idx) => {
        const order = orderNumbers[idx] || mainOrderNumber;
        const safeName = att.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'alumno';
        return {
          content: att.pdfBuffer.toString('base64'),
          filename: `etiquetas_${safeName}_${order || 'orden'}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        };
      }),
    };

    await sgMail.send(msg);
    logger.log(
      `Email múltiple enviado exitosamente a ${to} para ${attachments.length} alumno(s)`
    );
    return true;
  } catch (error) {
    logger.error('Error enviando email múltiple con SendGrid:', error);
    if (error instanceof Error) {
      logger.error(`Error details: ${error.message}`);
    }
    return false;
  }
}
