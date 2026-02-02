import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/helpers/logger";
import { getApoderadoByDocumentId } from "@/lib/api/apoderados";
import { sendEmailWithMultiplePDFs } from "@/lib/api/email";

interface PdfAttachmentPayload {
  pdfBase64?: string;
  studentName: string;
  orderNumber?: string | number;
  /** URL pública del PDF (Strapi). Si está presente, el correo muestra enlace de descarga y no adjunta el archivo. */
  pdfUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apoderadoDocumentId, attachments } = body as {
      apoderadoDocumentId?: string;
      attachments?: PdfAttachmentPayload[];
    };

    if (!apoderadoDocumentId) {
      return NextResponse.json(
        { success: false, error: "Falta apoderadoDocumentId" },
        { status: 400 }
      );
    }

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay adjuntos de PDF para enviar" },
        { status: 400 }
      );
    }

    // Obtener email del apoderado desde Strapi
    const apoderado = await getApoderadoByDocumentId(apoderadoDocumentId);

    if (!apoderado || !apoderado.email || !apoderado.email.trim()) {
      logger.warn(
        `No se pudo enviar email combinado: apoderado ${apoderadoDocumentId} sin email`
      );
      // No consideramos esto un error "duro" para el flujo principal
      return NextResponse.json({
        success: false,
        error: "El apoderado no tiene email registrado",
      });
    }

    const payloads = attachments.map((att) => ({
      pdfBuffer: att.pdfBase64 ? Buffer.from(att.pdfBase64, "base64") : undefined,
      studentName: att.studentName || "Estudiante",
      pdfUrl: att.pdfUrl && att.pdfUrl.trim() ? att.pdfUrl.trim() : undefined,
    }));

    const orderNumbers = attachments.map((att) =>
      att.orderNumber !== undefined && att.orderNumber !== null
        ? String(att.orderNumber)
        : ""
    );

    const guardianName = [
      apoderado.nombres,
      apoderado.primer_apellido,
      apoderado.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const emailSent = await sendEmailWithMultiplePDFs(
      apoderado.email,
      orderNumbers,
      payloads,
      guardianName || undefined
    );

    return NextResponse.json({ success: emailSent });
  } catch (error: unknown) {
    logger.error("Error en /api/send-pdfs-email:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al enviar email con múltiples PDFs",
      },
      { status: 500 }
    );
  }
}

