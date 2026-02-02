/**
 * Plantillas HTML para correos (diseño "Correo 01 - envío a domicilio").
 * HTML con estilos inline para compatibilidad con clientes de correo.
 */

/** Un ítem de la sección de PDFs: nombre del archivo y opcionalmente URL para descargar. */
export interface AttachmentItem {
  filename: string;
  downloadUrl?: string;
}

export interface ConfirmacionEnvioParams {
  /** Nombre del apoderado para el saludo (ej. "María González") */
  guardianName: string;
  /** Número de orden a mostrar */
  orderNumber: string;
  /** Lista de PDFs: nombre y opcionalmente URL de descarga (si hay URL se muestra enlace con icono en vez de "PDF adjunto"). */
  attachmentItems: AttachmentItem[];
  /** URL o data URI del icono de check. Si no se pasa, se usa SVG por defecto. */
  checkIconSrc?: string;
}

const CHECK_ICON_SVG =
  '<svg width="120" height="120" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#E8F5E9" stroke="#4CAF50" stroke-width="2"/><path d="M24 40l10 10 22-22" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Icono de bombilla para la caja de aviso (compatible con clientes de correo). */
const LIGHTBULB_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="display:block;"><path fill="#164296" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>';

/** Icono de documento/PDF para el cuadrado amarillo (blanco sobre fondo #ffc403). */
const FILE_PDF_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="display:block;"><path fill="white" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm0 2l5 5h-5V4zm-4 9h2v4h-2v-4zm0-3h2v2h-2v-2zm4 3h2v4h-2v-4zm0-3h2v2h-2v-2z"/></svg>';

const DOWNLOAD_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#99A1AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';

const MAP_PIN_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="#164296" stroke="#164296" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';

const CALENDAR_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="#164296" stroke="#164296" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Genera el HTML del cuerpo del correo de confirmación (envío a domicilio).
 */
export function buildConfirmacionEnvioHtml(params: ConfirmacionEnvioParams): string {
  const { guardianName, orderNumber, attachmentItems, checkIconSrc } = params;
  const safeName = escapeHtml(guardianName.trim() || 'Apoderado/a');
  const safeOrder = escapeHtml(String(orderNumber || '—'));
  const headerIcon =
    checkIconSrc && checkIconSrc.trim()
      ? `<img src="${escapeHtml(checkIconSrc.trim())}" alt="Listo" width="120" height="120" style="display:block;margin:0 auto 24px;border:0;" />`
      : `<div style="width:120px;height:120px;margin:0 auto 24px;">${CHECK_ICON_SVG}</div>`;

  const attachmentRowsHtml = attachmentItems
    .map((item, i) => {
      const safeFile = escapeHtml(item.filename);
      const isLast = i === attachmentItems.length - 1;
      const borderStyle = isLast ? '' : ' border-bottom: 1px solid #e5e7eb;';
      const hasLink = Boolean(item.downloadUrl && item.downloadUrl.trim().startsWith('http'));
      const safeUrl = hasLink ? escapeHtml(item.downloadUrl!.trim()) : '';
      const subtitle = hasLink ? 'Haz clic en el botón para descargar' : 'PDF adjunto en el correo';
      const actionCell = hasLink && safeUrl
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 14px;background:#164296;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;border-radius:6px;">${DOWNLOAD_SVG} Descargar PDF</a>`
        : DOWNLOAD_SVG;
      return `
        <tr>
          <td style="padding: 12px 16px;${borderStyle} vertical-align: middle;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="34" style="vertical-align: middle;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 34px; height: 34px; background: #ffc403; border-radius: 4px;"><tr><td align="center" valign="middle">${FILE_PDF_SVG}</td></tr></table>
                </td>
                <td style="padding-left: 12px; vertical-align: middle;">
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e2939;">${safeFile}</p>
                  <p style="margin: 2px 0 0 0; font-size: 11px; color: #6a7282;">${escapeHtml(subtitle)}</p>
                </td>
                <td style="vertical-align: middle; text-align: right; padding-left: 12px;">${actionCell}</td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Etiquetas Escolares</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #1e2939; background: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 32px 24px 24px;">
              <!-- Header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    ${headerIcon}
                    <h1 style="margin: 0 0 8px 0; font-size: 21px; font-weight: bold; color: #1e2939; text-align: center;">Hola ${safeName}</h1>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e2939; text-align: center;">¡Tus etiquetas escolares personalizadas ya están listas!</p>
                  </td>
                </tr>
              </table>
              <!-- Info tip (ícono de bombilla + texto) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #eff6ff; border-radius: 10px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="32" style="vertical-align: top; padding-right: 12px; width: 32px; min-width: 32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="24" height="24" style="width: 24px; height: 24px;">${LIGHTBULB_SVG}</td></tr></table>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0; font-size: 12px; line-height: 15px; color: #1e2939;">A continuación podrás descargar tus etiquetas, por si deseas tenerlas en <strong>formato digital</strong> o imprimirlas por tu cuenta.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Attachment(s) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                ${attachmentRowsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px;">
              <div style="height: 1px; background: #F3F4F6; width: 100%;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1e2939;">¿Quieres que te las entreguemos listas e impresas?</p>
                    <p style="margin: 0; font-size: 14px; color: #1e2939;">Acércate a nuestra tienda indicando tu número de orden:</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-block; background: #fff; border: 1px solid #6a7282; border-radius: 8px; padding: 8px 24px;">
                      <p style="margin: 0; font-size: 12px; font-weight: 600; color: #1e2939;">Número de orden ${safeOrder}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f3f4f6; border-left: 4px solid #9e2488; border-radius: 0 4px 4px 0; padding: 12px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="20" style="vertical-align: top; padding-top: 2px; width: 20px;">${MAP_PIN_SVG}</td>
                        <td style="padding-left: 8px; font-size: 12px; color: #1e2939; line-height: 1.4;"><strong>Librería Escolar:</strong> Av. Apoquindo 4900, Local 173</td>
                      </tr>
                      <tr>
                        <td width="20" style="vertical-align: top; padding-top: 6px; width: 20px;">${CALENDAR_SVG}</td>
                        <td style="padding-left: 8px; padding-top: 6px; font-size: 12px; color: #1e2939; line-height: 1.4;"><strong>Horario de atención:</strong> Lunes a viernes de 10:30 a 19:00 hrs.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #4a5565; max-width: 425px;">Si necesitas hacer algún cambio en tus datos o agregar otro alumno, puedes responder este correo.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid #f3f4f6;">
                    <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #164296;">¡Gracias por preferirnos!</p>
                    <p style="margin: 0; font-size: 16px; color: #6a7282;">Librería Escolar.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height: 48px;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Genera la versión en texto plano del correo de confirmación.
 */
export function buildConfirmacionEnvioText(params: ConfirmacionEnvioParams): string {
  const { guardianName, orderNumber, attachmentItems } = params;
  const name = guardianName.trim() || 'Apoderado/a';
  const order = String(orderNumber || '—');
  const fileList = attachmentItems.length
    ? attachmentItems
        .map((item) =>
          item.downloadUrl && item.downloadUrl.trim().startsWith('http')
            ? `  - ${item.filename}\n    Descargar: ${item.downloadUrl.trim()}`
            : `  - ${item.filename} (PDF adjunto en el correo)`
        )
        .join('\n')
    : '  - (PDF adjunto en el correo)';

  return `Etiquetas Escolares

Hola ${name},

¡Tus etiquetas escolares personalizadas ya están listas!

A continuación podrás descargar tus etiquetas, por si deseas tenerlas en formato digital o imprimirlas por tu cuenta.

Archivos:
${fileList}

¿Quieres que te las entreguemos listas e impresas?
Acércate a nuestra tienda indicando tu número de orden: ${order}

Librería Escolar: Av. Apoquindo 4900, Local 173
Horario de atención: Lunes a viernes de 10:30 a 19:00 hrs.

Si necesitas hacer algún cambio en tus datos o agregar otro alumno, puedes responder este correo.

¡Gracias por preferirnos!
Librería Escolar.`;
}
