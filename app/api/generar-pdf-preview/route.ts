import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/helpers/logger";

/**
 * API route para generar PDFs de prueba con Puppeteer (sin subir a Strapi ni enviar correos)
 *
 * GET /api/generar-pdf-preview?etiquetasUrl=/etiquetas?...
 *
 * - Usa el mismo motor de Puppeteer que la ruta real de generación de PDFs
 * - Devuelve el PDF directamente como respuesta (application/pdf)
 * - No guarda nada en Strapi y no dispara envíos de email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const etiquetasUrlParam = searchParams.get("etiquetasUrl");

    if (!etiquetasUrlParam) {
      return NextResponse.json(
        {
          error: "Parámetro faltante",
          message: "Debes enviar el parámetro 'etiquetasUrl' con la ruta de etiquetas a imprimir (por ejemplo, /etiquetas?studentName=...).",
        },
        { status: 400 }
      );
    }

    // Resolver URL base de la app
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    }

    const fullEtiquetasUrl = etiquetasUrlParam.startsWith("http")
      ? etiquetasUrlParam
      : `${baseUrl}${etiquetasUrlParam.startsWith("/") ? etiquetasUrlParam : `/${etiquetasUrlParam}`}`;

    logger.log("[generar-pdf-preview] Generando PDF de prueba para URL:", {
      fullEtiquetasUrl,
    });

    // Generar PDF con Puppeteer-core (mismo enfoque que en /api/generar-pdf)
    const puppeteer = await import("puppeteer-core");
    const fs = await import("fs");

    let executablePath =
      process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;

    if (!executablePath) {
      const possiblePaths = [
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        process.env.LOCALAPPDATA
          ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
          : null,
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ].filter(Boolean) as string[];

      for (const possiblePath of possiblePaths) {
        try {
          if (fs.default.existsSync(possiblePath)) {
            executablePath = possiblePath;
            logger.log("[generar-pdf-preview] Chrome encontrado en:", possiblePath);
            break;
          }
        } catch {
          // ignorar y seguir buscando
        }
      }
    }

    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
      ],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    } else {
      launchOptions.channel = "chrome";
      logger.warn(
        "[generar-pdf-preview] No se encontró ejecutable de Chrome en rutas comunes, intentando usar channel 'chrome'"
      );
    }

    const browser = await puppeteer.default.launch(launchOptions);
    const page = await browser.newPage();

    await page.goto(fullEtiquetasUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pdfUint8Array = await page.pdf({
      format: "letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    const pdfBuffer = Buffer.from(pdfUint8Array);

    logger.log("[generar-pdf-preview] PDF de prueba generado, tamaño (bytes):", {
      length: pdfBuffer.length,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"etiquetas_preview.pdf\"",
      },
    });
  } catch (error: unknown) {
    logger.error("[generar-pdf-preview] Error generando PDF de prueba:", error);

    return NextResponse.json(
      {
        error: "Error al generar PDF de prueba",
        message:
          "Ocurrió un error al generar el PDF de prueba con Puppeteer. Revisa los logs para más detalle.",
      },
      { status: 500 }
    );
  }
}
