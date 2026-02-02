import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/helpers/logger";
import { env } from "@/lib/env";
import { strapi } from "@/lib/api/strapi";
import type { EtiquetaPDF, StrapiResponse, StrapiCollectionResponse } from "@/types/strapi";

/**
 * API route para generar y subir PDF a Strapi
 * POST /api/generar-pdf
 * 
 * Esta ruta recibe los datos del registro y genera el PDF usando Puppeteer
 * para renderizar la página de etiquetas, luego lo sube a Strapi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      apoderadoDocumentId,
      alumnoDocumentId,
      hash_qr,
      numero_orden,
      año_escolar,
      colegio_nombre,
      etiquetasUrl, // URL relativa o absoluta de la página de etiquetas con query params
      studentName, // Nombre del estudiante para el email (opcional, se puede obtener de la URL)
    } = body;

    // Validar campos requeridos con logging detallado
    const missingFields: string[] = [];
    if (!apoderadoDocumentId) missingFields.push('apoderadoDocumentId');
    if (!alumnoDocumentId) missingFields.push('alumnoDocumentId');
    if (!hash_qr) missingFields.push('hash_qr');
    if (!etiquetasUrl) missingFields.push('etiquetasUrl');
    
    if (missingFields.length > 0) {
      logger.error("Faltan campos requeridos:", missingFields);
      return NextResponse.json(
        { 
          error: "Faltan campos requeridos",
          missingFields: missingFields,
        },
        { status: 400 }
      );
    }

    // Obtener la URL base de la aplicación
    // Prioridad: 1. Variable de entorno, 2. URL del request, 3. Railway domain, 4. localhost
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
          ? 'https://etiquetas.up.railway.app' // Fallback hardcodeado si es necesario
          : 'http://localhost:3000';
      }
    }
    
    // Construir la URL completa de la página de etiquetas
    const fullEtiquetasUrl = etiquetasUrl.startsWith('http') 
      ? etiquetasUrl 
      : `${baseUrl}${etiquetasUrl.startsWith('/') ? etiquetasUrl : `/${etiquetasUrl}`}`;

    // Intentar usar Puppeteer para generar el PDF
    let pdfBuffer: Buffer;
    
    try {
      // Importar puppeteer-core dinámicamente (solo se carga cuando se necesita)
      const puppeteer = await import('puppeteer-core');
      const fs = await import('fs');
      const path = await import('path');
      
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
        // Si esto falla, el error será más claro
        logger.warn('No se encontró Chrome/Chromium en rutas comunes. Intentando usar channel...');
        launchOptions.channel = 'chrome';
      }
      
      // Log sanitizado sin exponer rutas completas
      logger.log('Lanzando Puppeteer', {
        tieneExecutablePath: !!launchOptions.executablePath,
        usandoChannel: !!launchOptions.channel,
      });
      
      const browser = await puppeteer.default.launch(launchOptions);

      const page = await browser.newPage();
      
      // Navegar a la página de etiquetas
      await page.goto(fullEtiquetasUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Esperar un poco más para que todo se renderice
      // waitForTimeout fue deprecado, usar setTimeout con Promise
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generar PDF con las mismas configuraciones que la impresión
      // page.pdf() retorna Uint8Array, necesitamos convertirlo a Buffer
      const pdfUint8Array = await page.pdf({
        format: 'letter',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      // Convertir Uint8Array a Buffer
      pdfBuffer = Buffer.from(pdfUint8Array);

      await browser.close();
      
      logger.log(`PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`);
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

    // Subir PDF a Strapi usando FormData
    // En Strapi v5, para crear un registro con archivo y relaciones, necesitamos:
    // 1. Primero subir el archivo
    // 2. Luego crear el registro con el ID del archivo
    
    const STRAPI_URL = env.STRAPI_URL;
    const STRAPI_TOKEN = env.STRAPI_API_TOKEN;

    if (!STRAPI_URL || !STRAPI_TOKEN) {
      logger.error("Faltan variables de entorno STRAPI_URL o STRAPI_API_TOKEN");
      return NextResponse.json(
        { error: "Configuración de Strapi incompleta" },
        { status: 500 }
      );
    }

    // Paso 1: Subir el archivo PDF primero
    // Subiendo archivo PDF a Strapi
    const uploadFormData = new FormData();
    const pdfUint8Array = new Uint8Array(pdfBuffer);
    const pdfBlob = new Blob([pdfUint8Array], { type: 'application/pdf' });
    uploadFormData.append('files', pdfBlob, `etiqueta_${hash_qr}.pdf`);

    const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      // Log sanitizado sin exponer detalles completos del error
      logger.error("Error subiendo archivo PDF a Strapi", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorType: errorData.error?.name || 'Unknown',
      });
      return NextResponse.json(
        { 
          error: "Error al subir archivo PDF a Strapi",
          details: errorData.error?.message || uploadResponse.statusText,
          status: uploadResponse.status
        },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    // Archivo subido exitosamente
    
    // En Strapi v5, el upload devuelve un array con objetos que tienen 'id' (numérico)
    // Para campos de media, necesitamos usar el 'id' numérico, no el documentId
    const uploadedFile = Array.isArray(uploadData) ? uploadData[0] : uploadData;
    const fileId = uploadedFile?.id; // Usar 'id' numérico para campos de media
    
    if (!fileId) {
      logger.error("Strapi no devolvió el ID del archivo subido");
      return NextResponse.json(
        { 
          error: "Error: Strapi no devolvió el ID del archivo subido"
        },
        { status: 500 }
      );
    }

    // URL pública del PDF para enlace de descarga en el correo
    const relativeUrl = (uploadedFile as { url?: string })?.url;
    const pdfUrl = relativeUrl
      ? (relativeUrl.startsWith('http') ? relativeUrl : `${STRAPI_URL.replace(/\/$/, '')}${relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`}`)
      : null;

    // Archivo PDF subido exitosamente

    // Paso 2: Generar número de orden secuencial único (si no se proporciona)
    const { generateUniqueOrderNumber } = await import('@/lib/helpers/order-number');
    
    let finalOrderNumber: number;
    if (numero_orden) {
      // Si se proporciona un número de orden, usarlo (aunque normalmente no se enviará)
      finalOrderNumber = parseInt(numero_orden.toString());
    } else {
      // Generar número de orden secuencial único
      try {
        const orderNumberString = await generateUniqueOrderNumber();
        finalOrderNumber = parseInt(orderNumberString);
        logger.log(`Número de orden secuencial generado: ${finalOrderNumber}`);
      } catch (error) {
        logger.error("Error generando número de orden único:", error);
        return NextResponse.json(
          { 
            error: "Error al generar número de orden",
            message: "No se pudo generar un número de orden único. Por favor, intenta nuevamente.",
          },
          { status: 500 }
        );
      }
    }

    // Paso 3: Crear el registro con el archivo y las relaciones usando el cliente de Strapi
    // Creando registro de etiqueta PDF en Strapi
    const validEndpoint = "etiquetas-pdf";
    
    const recordData = {
      apoderado: apoderadoDocumentId,
      alumno: alumnoDocumentId,
      fecha_generacion: new Date().toISOString(), // Formato ISO para datetime
      hash_qr: hash_qr,
      numero_orden: finalOrderNumber,
      año_escolar: año_escolar || new Date().getFullYear(),
      colegio_nombre: colegio_nombre || '',
      estado: 'generado' as const,
      archivo_pdf: fileId, // ID numérico del archivo subido
    };

    // Enviando datos a Strapi
    
    // El error 405 cuando puedes crear manualmente sugiere un problema con los permisos de la API Key
    // Aunque tengas "Full Access", en Strapi v5 a veces necesitas verificar permisos específicos por Content Type

    // Usar el cliente de Strapi que ya maneja el formato correcto
    let strapiData: StrapiResponse<EtiquetaPDF>;
    try {
      strapiData = await strapi.post<StrapiResponse<EtiquetaPDF>>(
        validEndpoint,
        recordData
      );
    } catch (error) {
      // Si el error es 405, proporcionar instrucciones más específicas
      if (error instanceof Error && error.message.includes('405')) {
        logger.error("═══════════════════════════════════════════════════════");
        logger.error("ERROR 405: El endpoint existe pero no acepta POST");
        logger.error("═══════════════════════════════════════════════════════");
        logger.error("DIAGNÓSTICO:");
        logger.error("  ✓ Puedes crear manualmente → Content Type está bien");
        logger.error("  ✓ Servidor reiniciado → Endpoint debería estar disponible");
        logger.error("  ✗ API devuelve 405 → Problema con permisos de API Key");
        logger.error("");
        logger.error("SOLUCIÓN:");
        logger.error("El Content Type 'etiquetas-pdf' no aparece en los permisos de tu API Key.");
        logger.error("Esto indica que Strapi no lo reconoce como un Content Type válido para la API.");
        logger.error("");
        logger.error("VERIFICACIONES EN STRAPI:");
        logger.error("1. Ve a Content-Type Builder → etiquetas-pdf");
        logger.error("   - Verifica que esté guardado (debe tener un check verde)");
        logger.error("   - Si hay un botón 'Save', haz clic en él");
        logger.error("");
        logger.error("2. Verifica el nombre del Content Type:");
        logger.error("   - Singular name: 'etiqueta-pdf'");
        logger.error("   - Plural name: 'etiquetas-pdf' (sin 's' extra)");
        logger.error("   - Display name: 'Etiquetas - PDFs'");
        logger.error("");
        logger.error("3. Si el Content Type tiene guiones en el nombre, puede causar problemas:");
        logger.error("   - Considera renombrarlo sin guiones (ej: 'etiquetasPdf')");
        logger.error("   - O verifica que el pluralName sea exactamente 'etiquetas-pdf'");
        logger.error("");
        logger.error("4. Reinicia Strapi después de hacer cambios:");
        logger.error("   - Detén el servidor Strapi");
        logger.error("   - Inícialo de nuevo");
        logger.error("");
        logger.error("5. Después de reiniciar, crea una NUEVA API Key:");
        logger.error("   - Settings → API Tokens → Create new API Token");
        logger.error("   - Token type: 'Full access'");
        logger.error("   - Verifica que 'etiquetas-pdf' aparezca en la lista");
        logger.error("   - Si NO aparece, el Content Type no está correctamente configurado");
        logger.error("");
        logger.error("ALTERNATIVA: Si nada funciona, considera renombrar el Content Type");
        logger.error("sin guiones (ej: 'etiquetasPdf') y actualizar el código en consecuencia.");
        logger.error("═══════════════════════════════════════════════════════");
      }
      throw error;
    }

    // Registro de etiqueta PDF creado exitosamente

    // Incluir el PDF en base64 para que el cliente pueda agrupar varios
    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      message: "PDF generado y subido exitosamente",
      data: strapiData,
      pdfBase64,
      pdfUrl: pdfUrl || null,
      orderNumber: finalOrderNumber,
      studentName: studentName || null,
    });

  } catch (error: unknown) {
    // Log sanitizado sin exponer detalles completos del error
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    logger.error("Error en generar-pdf", {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      hasMessage: !!errorMessage,
    });
    
    return NextResponse.json(
      { 
        error: "Error al generar PDF",
        message: "Ocurrió un error al generar el PDF. Por favor, intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}
