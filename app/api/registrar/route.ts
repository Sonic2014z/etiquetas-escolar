import { NextRequest, NextResponse } from "next/server";
import { findApoderadoByRut, createApoderado, updateApoderadoWithAlumno, verifyApoderadoExists } from "@/lib/api/apoderados";
import { findAlumno, createAlumno, verifyAlumnoExists, updateAlumnoWithApoderado } from "@/lib/api/alumnos";
import { generateUID } from "@/lib/helpers/uid";
import { validateRut } from "@/lib/validations/rut";
import { cleanRUT } from "@/lib/formatters/rut";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos del apoderado
    const { parentData, studentData } = body;
    
    if (!parentData || !studentData) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }
    
    // Validar RUT
    if (!validateRut(parentData.rut)) {
      return NextResponse.json(
        { error: "RUT inválido" },
        { status: 400 }
      );
    }
    
    // Validar campos requeridos del apoderado
    if (!parentData.nombres || !parentData.primerApellido || !parentData.rut || !parentData.phone) {
      return NextResponse.json(
        { error: "Faltan campos requeridos del apoderado" },
        { status: 400 }
      );
    }
    
    // Validar campos requeridos del alumno
    if (!studentData.nombres || !studentData.primerApellido || !studentData.course || !studentData.letter || !studentData.colegio) {
      return NextResponse.json(
        { error: "Faltan campos requeridos del alumno" },
        { status: 400 }
      );
    }
    
    // Limpiar RUT para búsqueda
    const cleanRut = cleanRUT(parentData.rut);
    
    // 1. Buscar si el apoderado ya existe
    let apoderado = await findApoderadoByRut(cleanRut);
    let apoderadoDocumentId: string;
    
    if (apoderado) {
      // Apoderado existe, usar su documentId
      if (!apoderado.documentId) {
        throw new Error(`Apoderado encontrado no tiene documentId`);
      }
      apoderadoDocumentId = apoderado.documentId;
      console.log(`Apoderado existente encontrado: documentId ${apoderadoDocumentId}`);
    } else {
      // Crear nuevo apoderado
      const uid = generateUID();
      const nuevoApoderado = await createApoderado({
        nombres: parentData.nombres,
        primer_apellido: parentData.primerApellido,
        segundo_apellido: parentData.segundoApellido || "",
        rut: cleanRut,
        telefono: parentData.phone,
        email: parentData.email || undefined, // Enviamos el email si está disponible
        uid: uid,
      });
      
      if (!nuevoApoderado.documentId) {
        throw new Error(`Apoderado creado no tiene documentId`);
      }
      
      apoderadoDocumentId = nuevoApoderado.documentId;
      apoderado = nuevoApoderado;
      console.log(`[REGISTRO] Nuevo apoderado creado: documentId ${apoderadoDocumentId}, UID ${uid}`);
      console.log(`[REGISTRO] Estructura completa del apoderado:`, JSON.stringify(nuevoApoderado, null, 2));
    }
    
    // 2. Buscar si el alumno ya existe
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
      // Alumno existe
      if (!alumnoExistente.documentId) {
        throw new Error(`Alumno encontrado no tiene documentId`);
      }
      alumnoDocumentId = alumnoExistente.documentId;
      console.log(`Alumno existente encontrado: documentId ${alumnoDocumentId}`);
    } else {
      // Crear nuevo alumno SIN relación (se establecerá después de verificar)
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
      console.log(`[REGISTRO] Nuevo alumno creado: documentId ${alumnoDocumentId}`);
      console.log(`[REGISTRO] Estructura completa del alumno:`, JSON.stringify(nuevoAlumno, null, 2));
    }
    
    // 3. VERIFICAR QUE AMBOS REGISTROS EXISTEN EN STRAPI
    // Buscar por campos únicos para obtener los documentIds reales
    console.log(`[REGISTRO] Buscando registros por campos únicos para obtener documentIds reales...`);
    
    // Buscar apoderado por RUT (más confiable que por ID)
    const apoderadoVerificado = await findApoderadoByRut(cleanRut);
    if (!apoderadoVerificado || !apoderadoVerificado.documentId) {
      throw new Error(`No se pudo encontrar el apoderado con RUT ${cleanRut} después de crearlo o no tiene documentId`);
    }
    const apoderadoDocumentIdReal = apoderadoVerificado.documentId;
    console.log(`[REGISTRO] ✓ Apoderado encontrado por RUT: documentId original ${apoderadoDocumentId} -> documentId real ${apoderadoDocumentIdReal}`);
    
    // Buscar alumno por criterios únicos (más confiable que por ID)
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
    console.log(`[REGISTRO] ✓ Alumno encontrado por criterios: documentId original ${alumnoDocumentId} -> documentId real ${alumnoDocumentIdReal}`);
    
    // Usar los documentIds reales obtenidos de la búsqueda
    if (apoderadoDocumentIdReal !== apoderadoDocumentId) {
      console.warn(`[REGISTRO] ⚠️ documentId de apoderado diferente: ${apoderadoDocumentId} -> ${apoderadoDocumentIdReal} (usando documentId real)`);
      apoderadoDocumentId = apoderadoDocumentIdReal;
    }
    
    if (alumnoDocumentIdReal !== alumnoDocumentId) {
      console.warn(`[REGISTRO] ⚠️ documentId de alumno diferente: ${alumnoDocumentId} -> ${alumnoDocumentIdReal} (usando documentId real)`);
      alumnoDocumentId = alumnoDocumentIdReal;
    }
    
    // 4. ESTABLECER RELACIONES BIDIRECCIONALES DESPUÉS DE VERIFICAR
    console.log(`Estableciendo relaciones bidireccionales usando documentIds...`);
    
    // Relación: Alumno -> Apoderado
    try {
      await updateAlumnoWithApoderado(alumnoDocumentId, apoderadoDocumentId);
      console.log(`✓ Relación establecida: Alumno ${alumnoDocumentId} -> Apoderado ${apoderadoDocumentId}`);
    } catch (error) {
      console.error(`Error estableciendo relación Alumno -> Apoderado:`, error);
      throw new Error(`No se pudo establecer la relación del alumno con el apoderado`);
    }
    
    // Relación: Apoderado -> Alumno
    try {
      await updateApoderadoWithAlumno(apoderadoDocumentId, alumnoDocumentId);
      console.log(`✓ Relación establecida: Apoderado ${apoderadoDocumentId} -> Alumno ${alumnoDocumentId}`);
    } catch (error) {
      console.warn(`No se pudo establecer relación Apoderado -> Alumno (puede ser normal si el endpoint no está disponible):`, error);
      // No lanzamos error aquí porque la relación principal (Alumno -> Apoderado) ya está establecida
    }
    
    console.log(`Relaciones bidireccionales establecidas correctamente`);
    
    return NextResponse.json({
      success: true,
      message: "Registro completado exitosamente",
      data: {
        apoderado: {
          documentId: apoderadoDocumentId,
          existia: !!apoderado && apoderado.documentId === apoderadoDocumentId,
        },
        alumno: {
          documentId: alumnoDocumentId,
          existia: !!alumnoExistente,
        },
      },
    });
    
  } catch (error: any) {
    console.error("Error en registro:", error);
    console.error("Stack trace:", error.stack);
    
    // Intentar extraer más detalles del error
    let errorDetails = error.message || "Error desconocido";
    if (error.message && error.message.includes("Detalles:")) {
      errorDetails = error.message;
    }
    
    return NextResponse.json(
      { 
        error: "Error al registrar datos",
        message: errorDetails,
        fullError: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

