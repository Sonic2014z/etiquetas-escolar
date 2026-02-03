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

/** Resultado del envío: éxito o fallo con mensaje. */
export type SendEmailResult = { success: true } | { success: false; error: string };

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
): Promise<SendEmailResult> {
  try {
    if (!env.SENDGRID_API_KEY) {
      logger.warn('SENDGRID_API_KEY no está configurada. No se puede enviar email.');
      return { success: false, error: 'SENDGRID_API_KEY no está configurada' };
    }
    if (!env.SENDGRID_DEFAULT_FROM) {
      logger.warn('SENDGRID_DEFAULT_FROM no está configurada. No se puede enviar email.');
      return { success: false, error: 'SENDGRID_DEFAULT_FROM no está configurada' };
    }
    initializeSendGrid();
    if (!to || !to.trim() || !to.includes('@')) {
      logger.warn(`Email del destinatario inválido: ${to}`);
      return { success: false, error: 'Email del destinatario inválido' };
    }

    const pdfFilename = `etiquetas_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${orderNumber}.pdf`;
    const checkIconSrc = await getCheckIconSrc();
    const html = buildConfirmacionEnvioHtml({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber,
      attachmentItems: [{ filename: pdfFilename }],
      ...(checkIconSrc && { checkIconSrc }),
      ...(env.APP_BASE_URL && env.APP_BASE_URL.startsWith('http') && { iconBaseUrl: env.APP_BASE_URL }),
    });
    const text = buildConfirmacionEnvioText({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber,
      attachmentItems: [{ filename: pdfFilename }],
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
    return { success: true };
  } catch (error) {
    logger.error('Error enviando email con SendGrid:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido al enviar email';
    return { success: false, error: message };
  }
}

/**
 * Envía un solo email con múltiples PDFs. Si cada ítem tiene pdfUrl, se muestra enlace de descarga y no se adjunta el PDF.
 *
 * @param to - Email del destinatario (apoderado)
 * @param orderNumbers - Lista de números de orden asociados a los PDFs
 * @param attachments - Por cada alumno: studentName, pdfBuffer (opcional) y pdfUrl (opcional). Si hay pdfUrl se usa enlace en vez de adjunto.
 * @param guardianName - Nombre del apoderado para el saludo (opcional)
 */
export async function sendEmailWithMultiplePDFs(
  to: string,
  orderNumbers: string[],
  attachments: { pdfBuffer?: Buffer; studentName: string; pdfUrl?: string }[],
  guardianName?: string
): Promise<SendEmailResult> {
  try {
    if (!env.SENDGRID_API_KEY) {
      logger.warn('SENDGRID_API_KEY no está configurada. No se puede enviar email.');
      return { success: false, error: 'SENDGRID_API_KEY no está configurada' };
    }
    if (!env.SENDGRID_DEFAULT_FROM) {
      logger.warn('SENDGRID_DEFAULT_FROM no está configurada. No se puede enviar email.');
      return { success: false, error: 'SENDGRID_DEFAULT_FROM no está configurada' };
    }
    initializeSendGrid();
    if (!to || !to.trim() || !to.includes('@')) {
      logger.warn(`Email del destinatario inválido: ${to}`);
      return { success: false, error: 'Email del destinatario inválido' };
    }
    if (!attachments || attachments.length === 0) {
      logger.warn('sendEmailWithMultiplePDFs llamado sin adjuntos');
      return { success: false, error: 'No hay adjuntos para enviar' };
    }

    const cleanedOrderNumbers = Array.from(
      new Set(
        (orderNumbers || [])
          .map((n) => (n ?? '').toString().trim())
          .filter((n) => n.length > 0)
      )
    );
    const mainOrderNumber = cleanedOrderNumbers[0] || 'varios';

    const attachmentItems = attachments.map((att, idx) => {
      const order = orderNumbers[idx] || mainOrderNumber;
      const safeName = att.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'alumno';
      const filename = `etiquetas_${safeName}_${order || 'orden'}.pdf`;
      return {
        filename,
        downloadUrl: att.pdfUrl && att.pdfUrl.trim().startsWith('http') ? att.pdfUrl.trim() : undefined,
      };
    });

    const checkIconSrc = await getCheckIconSrc();
    const html = buildConfirmacionEnvioHtml({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber: mainOrderNumber,
      attachmentItems,
      ...(checkIconSrc && { checkIconSrc }),
      ...(env.APP_BASE_URL && env.APP_BASE_URL.startsWith('http') && { iconBaseUrl: env.APP_BASE_URL }),
    });
    const text = buildConfirmacionEnvioText({
      guardianName: guardianName ?? 'Apoderado/a',
      orderNumber: mainOrderNumber,
      attachmentItems,
    });

    const subject =
      attachments.length === 1
        ? `Etiquetas Escolares - ${attachments[0].studentName} (Orden #${mainOrderNumber})`
        : `Etiquetas Escolares - ${attachments.length} alumnos (Órdenes #${cleanedOrderNumbers.join(', ') || mainOrderNumber})`;

    // Solo adjuntar PDFs cuando no hay URL de descarga (enlace en el correo)
    const attachmentsToSend = attachments
      .map((att, idx) => {
        const hasUrl = att.pdfUrl && att.pdfUrl.trim().startsWith('http');
        if (!att.pdfBuffer || hasUrl) return null;
        const order = orderNumbers[idx] || mainOrderNumber;
        const safeName = att.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'alumno';
        return {
          content: att.pdfBuffer.toString('base64'),
          filename: `etiquetas_${safeName}_${order || 'orden'}.pdf`,
          type: 'application/pdf' as const,
          disposition: 'attachment' as const,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const msg: any = {
      to: to.trim(),
      from: env.SENDGRID_DEFAULT_FROM,
      subject,
      ...(env.SENDGRID_DEFAULT_REPLY_TO && { replyTo: env.SENDGRID_DEFAULT_REPLY_TO }),
      html,
      text,
      attachments: attachmentsToSend,
    };

    await sgMail.send(msg);
    logger.log(
      `Email múltiple enviado exitosamente a ${to} para ${attachments.length} alumno(s)`
    );
    return { success: true };
  } catch (error) {
    logger.error('Error enviando email múltiple con SendGrid:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido al enviar email';
    return { success: false, error: message };
  }
}
