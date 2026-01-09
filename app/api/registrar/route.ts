import { NextRequest, NextResponse } from "next/server";
import { findApoderadoByRut, createApoderado, updateApoderadoWithAlumno, verifyApoderadoExists } from "@/lib/api/apoderados";
import { findAlumno, createAlumno, verifyAlumnoExists, updateAlumnoWithApoderado } from "@/lib/api/alumnos";
import { generateUID } from "@/lib/helpers/uid";
import { validateRut } from "@/lib/validations/rut";
import { cleanRUT } from "@/lib/formatters/rut";
import { checkRateLimit, getRequestIP } from "@/lib/helpers/rate-limit";

interface AlumnoExitoso {
  documentId: string;
  existia: boolean;
  index: number;
  nombre: string;
}

interface AlumnoFallido {
  index: number;
  nombre: string;
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: verificar límite de requests
    const clientIP = getRequestIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Por favor, intenta nuevamente más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }
    
    const body = await request.json();
    
    // Validar datos del apoderado
    const { parentData, studentsData } = body;
    
    // Soporte para formato antiguo (studentData) y nuevo (studentsData)
    const students = studentsData || (body.studentData ? [body.studentData] : []);
    
    // ========== VALIDACIONES ADICIONALES ANTES DE PROCESAR ==========
    
    // Validar estructura básica
    if (!parentData || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos. Debe haber al menos un alumno." },
        { status: 400 }
      );
    }
    
    // Validar campos requeridos del apoderado (RUT ya no es obligatorio)
    if (!parentData.nombres || !parentData.nombres.trim()) {
      return NextResponse.json(
        { error: "El nombre del apoderado es requerido" },
        { status: 400 }
      );
    }
    if (!parentData.primerApellido || !parentData.primerApellido.trim()) {
      return NextResponse.json(
        { error: "El primer apellido del apoderado es requerido" },
        { status: 400 }
      );
    }
    if (!parentData.phone || !parentData.phone.trim()) {
      return NextResponse.json(
        { error: "El teléfono del apoderado es requerido" },
        { status: 400 }
      );
    }
    
    // Validar RUT solo si está presente (ya no es obligatorio)
    if (parentData.rut && parentData.rut.trim()) {
      if (!validateRut(parentData.rut)) {
        return NextResponse.json(
          { error: "RUT inválido. Por favor, verifique el formato." },
          { status: 400 }
        );
      }
    }
    
    // Validar campos requeridos de cada alumno ANTES de procesar
    const erroresValidacion: Array<{ index: number; campo: string; mensaje: string }> = [];
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      if (!studentData.nombres || !studentData.nombres.trim()) {
        erroresValidacion.push({ index: i + 1, campo: 'nombres', mensaje: `Alumno ${i + 1}: Nombres es requerido` });
      }
      if (!studentData.primerApellido || !studentData.primerApellido.trim()) {
        erroresValidacion.push({ index: i + 1, campo: 'primerApellido', mensaje: `Alumno ${i + 1}: Primer apellido es requerido` });
      }
      if (!studentData.course || !studentData.course.trim()) {
        erroresValidacion.push({ index: i + 1, campo: 'course', mensaje: `Alumno ${i + 1}: Curso es requerido` });
      }
      if (!studentData.letter || !studentData.letter.trim()) {
        erroresValidacion.push({ index: i + 1, campo: 'letter', mensaje: `Alumno ${i + 1}: Letra es requerida` });
      }
      if (!studentData.colegio || !studentData.colegio.trim()) {
        erroresValidacion.push({ index: i + 1, campo: 'colegio', mensaje: `Alumno ${i + 1}: Colegio es requerido` });
      }
    }
    
    if (erroresValidacion.length > 0) {
      return NextResponse.json(
        { 
          error: "Errores de validación",
          detalles: erroresValidacion.map(e => e.mensaje),
        },
        { status: 400 }
      );
    }
    
    // Validar que ningún alumno tenga el mismo nombre que el apoderado
    const nombreApoderado = `${parentData.nombres} ${parentData.primerApellido} ${parentData.segundoApellido || ""}`.trim().toLowerCase();
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      const nombreAlumno = `${studentData.nombres} ${studentData.primerApellido} ${studentData.segundoApellido || ""}`.trim().toLowerCase();
      
      if (nombreApoderado && nombreAlumno && nombreApoderado === nombreAlumno) {
        return NextResponse.json(
          { error: `Por seguridad, el nombre del alumno ${i + 1} no puede ser idéntico al nombre del apoderado. Si son homónimos, por favor agregue el segundo nombre o apellido.`},
          { status: 400 }
        );
      }
    }
    
    // ========== PROCESAMIENTO DEL APODERADO ==========
    
    let apoderadoDocumentId: string;
    let apoderadoExistia = false;
    
    // Si hay RUT, buscar por RUT; si no, crear nuevo apoderado
    if (parentData.rut && parentData.rut.trim()) {
      const cleanRut = cleanRUT(parentData.rut);
      let apoderado = await findApoderadoByRut(cleanRut);
      
      if (apoderado) {
        if (!apoderado.documentId) {
          throw new Error(`Apoderado encontrado no tiene documentId`);
        }
        apoderadoDocumentId = apoderado.documentId;
        apoderadoExistia = true;
      } else {
        const uid = generateUID();
        const nuevoApoderado = await createApoderado({
          nombres: parentData.nombres,
          primer_apellido: parentData.primerApellido,
          segundo_apellido: parentData.segundoApellido || "",
          rut: cleanRut,
          telefono: parentData.phone,
          email: parentData.email || undefined,
          uid: uid,
        });
        
        if (!nuevoApoderado.documentId) {
          throw new Error(`Apoderado creado no tiene documentId`);
        }
        
        apoderadoDocumentId = nuevoApoderado.documentId;
      }
      
      // Verificar que el apoderado existe en Strapi
      const apoderadoVerificado = await findApoderadoByRut(cleanRut);
      if (!apoderadoVerificado || !apoderadoVerificado.documentId) {
        throw new Error(`No se pudo encontrar el apoderado con RUT ${cleanRut} después de crearlo o no tiene documentId`);
      }
      const apoderadoDocumentIdReal = apoderadoVerificado.documentId;
      
      if (apoderadoDocumentIdReal !== apoderadoDocumentId) {
        apoderadoDocumentId = apoderadoDocumentIdReal;
      }
    } else {
      // No hay RUT, crear nuevo apoderado directamente
      const uid = generateUID();
      const nuevoApoderado = await createApoderado({
        nombres: parentData.nombres,
        primer_apellido: parentData.primerApellido,
        segundo_apellido: parentData.segundoApellido || "",
        rut: "", // RUT vacío ya que no es obligatorio
        telefono: parentData.phone,
        email: parentData.email || undefined,
        uid: uid,
      });
      
      if (!nuevoApoderado.documentId) {
        throw new Error(`Apoderado creado no tiene documentId`);
      }
      
      apoderadoDocumentId = nuevoApoderado.documentId;
    }
    
    // ========== PROCESAMIENTO DE ALUMNOS CON MANEJO DE ERRORES PARCIALES ==========
    
    const alumnosExitosos: Array<{ 
      documentId: string; 
      existia: boolean; 
      index: number;
      nombre: string;
    }> = [];
    
    const alumnosFallidos: Array<{ 
      index: number;
      nombre: string;
      error: string;
    }> = [];
    
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      const nombreAlumno = `${studentData.nombres} ${studentData.primerApellido} ${studentData.segundoApellido || ""}`.trim();
      
      try {
        // Buscar si el alumno ya existe
        const alumnoExistente = await findAlumno({
          nombres: studentData.nombres,
          primer_apellido: studentData.primerApellido,
          segundo_apellido: studentData.segundoApellido || "",
          curso: studentData.course,
          letra: studentData.letter,
          colegio: studentData.colegio,
        });
        
        let alumnoDocumentId: string;
        
        if (alumnoExistente) {
          if (!alumnoExistente.documentId) {
            throw new Error(`Alumno encontrado no tiene documentId`);
          }
          alumnoDocumentId = alumnoExistente.documentId;
        } else {
          const nuevoAlumno = await createAlumno({
            nombres: studentData.nombres,
            primer_apellido: studentData.primerApellido,
            segundo_apellido: studentData.segundoApellido || "",
            curso: studentData.course,
            letra: studentData.letter,
            colegio: studentData.colegio,
          });
          
          if (!nuevoAlumno.documentId) {
            throw new Error(`Alumno creado no tiene documentId`);
          }
          
          alumnoDocumentId = nuevoAlumno.documentId;
        }
        
        // Verificar que el alumno existe en Strapi
        const alumnoVerificado = await findAlumno({
          nombres: studentData.nombres,
          primer_apellido: studentData.primerApellido,
          segundo_apellido: studentData.segundoApellido || "",
          curso: studentData.course,
          letra: studentData.letter,
          colegio: studentData.colegio,
        });
        
        if (!alumnoVerificado || !alumnoVerificado.documentId) {
          throw new Error(`No se pudo encontrar el alumno después de crearlo o no tiene documentId`);
        }
        const alumnoDocumentIdReal = alumnoVerificado.documentId;
        
        if (alumnoDocumentIdReal !== alumnoDocumentId) {
          alumnoDocumentId = alumnoDocumentIdReal;
        }
        
        // Establecer relaciones bidireccionales
        try {
          await updateAlumnoWithApoderado(alumnoDocumentId, apoderadoDocumentId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          if (process.env.NODE_ENV === 'development') {
            console.error(`Error estableciendo relación Alumno ${i + 1} -> Apoderado:`, error);
          }
          throw new Error(`No se pudo establecer la relación del alumno con el apoderado: ${errorMessage}`);
        }
        
        try {
          await updateApoderadoWithAlumno(apoderadoDocumentId, alumnoDocumentId);
        } catch (error) {
          // No lanzamos error aquí porque la relación principal ya está establecida
          console.warn(`Advertencia: No se pudo actualizar la relación inversa del apoderado con el alumno ${i + 1}`);
        }
        
        alumnosExitosos.push({
          documentId: alumnoDocumentId,
          existia: !!alumnoExistente,
          index: i + 1,
          nombre: nombreAlumno,
        });
        
      } catch (error) {
        // Capturar error para este alumno específico y continuar con los demás
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al procesar el alumno";
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error procesando alumno ${i + 1} (${nombreAlumno}):`, error);
        }
        alumnosFallidos.push({
          index: i + 1,
          nombre: nombreAlumno,
          error: errorMessage,
        });
      }
    }
    
    // ========== RESPUESTA FINAL ==========
    
    // Si todos los alumnos fallaron, retornar error
    if (alumnosExitosos.length === 0 && alumnosFallidos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo registrar ningún alumno",
          message: `Todos los ${alumnosFallidos.length} alumnos fallaron al registrarse`,
          detalles: {
            apoderado: {
              documentId: apoderadoDocumentId,
              existia: apoderadoExistia,
            },
            alumnosExitosos: [],
            alumnosFallidos: alumnosFallidos,
          },
        },
        { status: 500 }
      );
    }
    
    // Si algunos alumnos fallaron, retornar éxito parcial
    if (alumnosFallidos.length > 0) {
      return NextResponse.json({
        success: true,
        partial: true,
        message: `${alumnosExitosos.length} de ${students.length} alumnos registrados exitosamente. ${alumnosFallidos.length} alumno(s) fallaron.`,
        data: {
          apoderado: {
            documentId: apoderadoDocumentId,
            existia: apoderadoExistia,
          },
          alumnosExitosos: alumnosExitosos,
          alumnosFallidos: alumnosFallidos,
        },
      }, {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        }
      });
    }
    
    // Si todos los alumnos fueron exitosos
    const mensaje = students.length === 1 
      ? "Registro completado exitosamente"
      : `${students.length} alumnos registrados exitosamente`;
    
    return NextResponse.json({
      success: true,
      message: mensaje,
      data: {
        apoderado: {
          documentId: apoderadoDocumentId,
          existia: apoderadoExistia,
        },
        alumnos: alumnosExitosos,
      },
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    if (process.env.NODE_ENV === 'development') {
      console.error("Error en registro:", error);
    }
    
    return NextResponse.json(
      { 
        error: "Error al registrar datos",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

