import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/helpers/logger";

/**
 * API route para generar PDF desde la página de preview
 * GET /api/generar-pdf-preview
 * 
 * Esta ruta genera un PDF usando Puppeteer desde la página /preview-completa
 * para poder verificar cómo se vería el resultado final.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener la URL base de la aplicación
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      // Intentar obtener desde el request
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    }
    
    // Si aún no tenemos URL, intentar usar Railway domain
    if (!baseUrl || baseUrl.includes('localhost')) {
      const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
      if (railwayDomain) {
        baseUrl = `https://${railwayDomain}`;
      } else {
        // Fallback a localhost solo en desarrollo
        baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://etiquetas.up.railway.app'
          : 'http://localhost:3000';
      }
    }
    
    // URL de la página de preview
    const previewUrl = `${baseUrl}/preview-completa`;

    // Intentar usar Puppeteer para generar el PDF
    let pdfBuffer: Buffer;
    
    try {
      // Importar puppeteer-core dinámicamente (solo se carga cuando se necesita)
      const puppeteer = await import('puppeteer-core');
      const fs = await import('fs');
      
      // Para puppeteer-core, necesitamos especificar el ejecutable de Chrome
      // Intentar encontrar Chrome en ubicaciones comunes
      let executablePath = process.env.CHROME_EXECUTABLE_PATH || 
                          process.env.PUPPETEER_EXECUTABLE_PATH;
      
      // Si no está configurado, intentar encontrar Chrome en ubicaciones comunes
      if (!executablePath) {
        const possiblePaths = [
          // Railway/Linux (prioridad para producción)
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
          // Windows
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
          // Mac
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ].filter(Boolean) as string[];
        
        // Buscar el primer ejecutable que exista
        for (const possiblePath of possiblePaths) {
          try {
            if (fs.default.existsSync(possiblePath)) {
              executablePath = possiblePath;
              logger.log(`Chrome encontrado en: ${executablePath}`);
              break;
            }
          } catch {
            // Continuar buscando
          }
        }
      }
      
      // Si aún no tenemos executablePath, intentar usar 'channel' o lanzar error
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
      };
      
      if (executablePath) {
        launchOptions.executablePath = executablePath;
      } else {
        // En Railway/producción, intentar usar 'channel' como último recurso
        logger.warn('No se encontró Chrome/Chromium en rutas comunes. Intentando usar channel...');
        launchOptions.channel = 'chrome';
      }
      
      logger.log('Lanzando Puppeteer para preview', {
        tieneExecutablePath: !!launchOptions.executablePath,
        usandoChannel: !!launchOptions.channel,
        previewUrl,
      });
      
      const browser = await puppeteer.default.launch(launchOptions);

      const page = await browser.newPage();
      
      // Navegar a la página de preview
      await page.goto(previewUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Esperar un poco más para que todo se renderice
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar PDF con las mismas configuraciones que la impresión
      const pdfUint8Array = await page.pdf({
        format: 'letter',
        printBackground: true,
        preferCSSPageSize: true, // Usar el tamaño de página definido en CSS
        margin: {
          top: '8mm',
          right: '10mm',
          bottom: '8mm',
          left: '10mm',
        },
        displayHeaderFooter: false, // No mostrar header/footer de Puppeteer
      });

      // Convertir Uint8Array a Buffer
      pdfBuffer = Buffer.from(pdfUint8Array);

      await browser.close();
      
      logger.log(`PDF de preview generado exitosamente, tamaño: ${pdfBuffer.length} bytes`);
    } catch (puppeteerError: unknown) {
      logger.error("Error generando PDF con Puppeteer:", puppeteerError);
      
      // Si Puppeteer no está disponible, retornar error informativo
      if (puppeteerError instanceof Error && 
          (puppeteerError.message.includes('Cannot find module') || 
           puppeteerError.message.includes('puppeteer'))) {
        return NextResponse.json(
          { 
            error: "Puppeteer-core no está instalado",
            message: "Para generar PDFs, instala puppeteer-core: npm install puppeteer-core",
            details: "Esta funcionalidad requiere puppeteer-core para renderizar la página y generar el PDF. También necesitas tener Chrome/Chromium instalado o configurar CHROME_EXECUTABLE_PATH."
          },
          { status: 500 }
        );
      }
      
      // Si el error es sobre el ejecutable de Chrome
      if (puppeteerError instanceof Error && 
          (puppeteerError.message.includes('executable') || 
           puppeteerError.message.includes('browser') ||
           puppeteerError.message.includes('Chrome') ||
           puppeteerError.message.includes('executablePath') ||
           puppeteerError.message.includes('channel'))) {
        return NextResponse.json(
          { 
            error: "No se encontró el ejecutable de Chrome",
            message: "puppeteer-core requiere Chrome/Chromium instalado",
            details: "Instala Chrome o configura la variable de entorno CHROME_EXECUTABLE_PATH con la ruta al ejecutable de Chrome. Ejemplo en Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          },
          { status: 500 }
        );
      }
      
      throw puppeteerError;
    }

    // Devolver el PDF como respuesta
    // NextResponse en el runtime de Next.js espera un BodyInit (Blob, ArrayBuffer, etc.),
    // por lo que convertimos el Buffer de Node a un Blob para evitar errores de tipo.
    const pdfUint8Array = new Uint8Array(pdfBuffer);
    const pdfBlob = new Blob([pdfUint8Array], { type: 'application/pdf' });

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="preview-etiquetas-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    logger.error("Error en generar-pdf-preview:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        error: "Error generando PDF de preview",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
