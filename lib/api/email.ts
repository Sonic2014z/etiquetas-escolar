import sgMail from '@sendgrid/mail';
import { logger } from '@/lib/helpers/logger';
import { env } from '@/lib/env';

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
 * Envía un email con un PDF adjunto usando SendGrid
 * 
 * @param to - Email del destinatario (apoderado)
 * @param pdfBuffer - Buffer del PDF a adjuntar
 * @param studentName - Nombre del estudiante para personalizar el email
 * @param orderNumber - Número de orden para incluir en el asunto
 * @returns Promise<boolean> - true si se envió exitosamente, false en caso contrario
 */
export async function sendEmailWithPDF(
  to: string,
  pdfBuffer: Buffer,
  studentName: string,
  orderNumber: string
): Promise<boolean> {
  try {
    // Verificar que SendGrid esté configurado
    if (!env.SENDGRID_API_KEY) {
      logger.warn('SENDGRID_API_KEY no está configurada. No se puede enviar email.');
      return false;
    }

    if (!env.SENDGRID_DEFAULT_FROM) {
      logger.warn('SENDGRID_DEFAULT_FROM no está configurada. No se puede enviar email.');
      return false;
    }

    // Inicializar SendGrid
    initializeSendGrid();

    // Validar email del destinatario
    if (!to || !to.trim() || !to.includes('@')) {
      logger.warn(`Email del destinatario inválido: ${to}`);
      return false;
    }

    // Convertir el buffer a base64 para el adjunto
    const pdfBase64 = pdfBuffer.toString('base64');

    // Preparar el mensaje
    const msg: any = {
      to: to.trim(),
      from: env.SENDGRID_DEFAULT_FROM,
      subject: `Etiquetas Escolares - ${studentName} (Orden #${orderNumber})`,
      ...(env.SENDGRID_DEFAULT_REPLY_TO && { replyTo: env.SENDGRID_DEFAULT_REPLY_TO }),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Etiquetas Escolares</h2>
            </div>
            
            <p>Estimado/a apoderado/a,</p>
            
            <p>Le informamos que las etiquetas escolares para <strong>${studentName}</strong> han sido generadas exitosamente.</p>
            
            <p>Adjunto encontrará el archivo PDF con las etiquetas correspondientes al número de orden <strong>#${orderNumber}</strong>.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Instrucciones:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Imprima el PDF adjunto en papel tamaño carta (Letter)</li>
                <li>Recorte las etiquetas siguiendo las guías de corte (borde rosa)</li>
                <li>Pegue las etiquetas en los útiles escolares de su hijo/a</li>
              </ul>
            </div>
            
            <p>Si tiene alguna consulta, no dude en contactarnos.</p>
            
            <p style="margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>Equipo Escolar</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              Este es un email automático, por favor no responda a este mensaje.
            </p>
          </body>
        </html>
      `,
      text: `
Etiquetas Escolares

Estimado/a apoderado/a,

Le informamos que las etiquetas escolares para ${studentName} han sido generadas exitosamente.

Adjunto encontrará el archivo PDF con las etiquetas correspondientes al número de orden #${orderNumber}.

Instrucciones:
- Imprima el PDF adjunto en papel tamaño carta (Letter)
- Recorte las etiquetas siguiendo las guías de corte (borde rosa)
- Pegue las etiquetas en los útiles escolares de su hijo/a

Si tiene alguna consulta, no dude en contactarnos.

Saludos cordiales,
Equipo Escolar

---
Este es un email automático, por favor no responda a este mensaje.
      `,
      attachments: [
        {
          content: pdfBase64,
          filename: `etiquetas_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${orderNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    // Enviar el email
    await sgMail.send(msg);
    
    logger.log(`Email enviado exitosamente a ${to} para el estudiante ${studentName}`);
    return true;

  } catch (error) {
    logger.error('Error enviando email con SendGrid:', error);
    
    // Log detallado del error si es de SendGrid
    if (error instanceof Error) {
      logger.error(`Error details: ${error.message}`);
    }
    
    return false;
  }
}

/**
 * Envía un solo email con múltiples PDFs adjuntos (uno por alumno).
 *
 * @param to - Email del destinatario (apoderado)
 * @param orderNumbers - Lista de números de orden asociados a los PDFs
 * @param attachments - Arreglo de buffers + nombre de estudiante por cada PDF
 */
export async function sendEmailWithMultiplePDFs(
  to: string,
  orderNumbers: string[],
  attachments: { pdfBuffer: Buffer; studentName: string }[]
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

    // Normalizar números de orden
    const cleanedOrderNumbers = Array.from(
      new Set(
        (orderNumbers || [])
          .map((n) => (n ?? '').toString().trim())
          .filter((n) => n.length > 0)
      )
    );

    const mainOrderNumber = cleanedOrderNumbers[0] || 'varios';

    const subject =
      attachments.length === 1
        ? `Etiquetas Escolares - ${attachments[0].studentName} (Orden #${mainOrderNumber})`
        : `Etiquetas Escolares - ${attachments.length} alumnos (Órdenes #${cleanedOrderNumbers.join(', ') || mainOrderNumber})`;

    // Construir lista de alumnos para el cuerpo del email
    const studentsListHtml = attachments
      .map((att, idx) => {
        const order = orderNumbers[idx] || mainOrderNumber;
        return `<li><strong>${att.studentName}</strong> (Orden #${order})</li>`;
      })
      .join('');

    const studentsListText = attachments
      .map((att, idx) => {
        const order = orderNumbers[idx] || mainOrderNumber;
        return `- ${att.studentName} (Orden #${order})`;
      })
      .join('\n');

    const msg: any = {
      to: to.trim(),
      from: env.SENDGRID_DEFAULT_FROM,
      subject,
      ...(env.SENDGRID_DEFAULT_REPLY_TO && { replyTo: env.SENDGRID_DEFAULT_REPLY_TO }),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Etiquetas Escolares</h2>
            </div>
            
            <p>Estimado/a apoderado/a,</p>
            
            <p>Le informamos que las etiquetas escolares para los siguientes alumnos han sido generadas exitosamente:</p>
            <ul style="margin: 10px 0 20px; padding-left: 20px;">
              ${studentsListHtml}
            </ul>
            
            <p>Adjunto encontrará los archivos PDF con las etiquetas correspondientes.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Instrucciones:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Imprima los PDFs adjuntos en papel tamaño carta (Letter)</li>
                <li>Recorte las etiquetas siguiendo las guías de corte (borde rosa)</li>
                <li>Pegue las etiquetas en los útiles escolares de sus hijos/as</li>
              </ul>
            </div>
            
            <p>Si tiene alguna consulta, no dude en contactarnos.</p>
            
            <p style="margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>Equipo Escolar</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              Este es un email automático, por favor no responda a este mensaje.
            </p>
          </body>
        </html>
      `,
      text: `
Etiquetas Escolares

Estimado/a apoderado/a,

Le informamos que las etiquetas escolares para los siguientes alumnos han sido generadas exitosamente:
${studentsListText}

Adjunto encontrará los archivos PDF con las etiquetas correspondientes.

Instrucciones:
- Imprima los PDFs adjuntos en papel tamaño carta (Letter)
- Recorte las etiquetas siguiendo las guías de corte (borde rosa)
- Pegue las etiquetas en los útiles escolares de sus hijos/as

Si tiene alguna consulta, no dude en contactarnos.

Saludos cordiales,
Equipo Escolar

---
Este es un email automático, por favor no responda a este mensaje.
      `,
      attachments: attachments.map((att, idx) => {
        const order = orderNumbers[idx] || mainOrderNumber;
        const safeName = att.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'alumno';
        const base64 = att.pdfBuffer.toString('base64');

        return {
          content: base64,
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
