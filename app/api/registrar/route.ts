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
      if (!apoderado.documentId) {
        throw new Error(`Apoderado encontrado no tiene documentId`);
      }
      apoderadoDocumentId = apoderado.documentId;
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
      apoderado = nuevoApoderado;
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
    
    // Verificar que ambos registros existen en Strapi
    const apoderadoVerificado = await findApoderadoByRut(cleanRut);
    if (!apoderadoVerificado || !apoderadoVerificado.documentId) {
      throw new Error(`No se pudo encontrar el apoderado con RUT ${cleanRut} después de crearlo o no tiene documentId`);
    }
    const apoderadoDocumentIdReal = apoderadoVerificado.documentId;
    
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
    
    if (apoderadoDocumentIdReal !== apoderadoDocumentId) {
      apoderadoDocumentId = apoderadoDocumentIdReal;
    }
    
    if (alumnoDocumentIdReal !== alumnoDocumentId) {
      alumnoDocumentId = alumnoDocumentIdReal;
    }
    
    // Establecer relaciones bidireccionales
    try {
      await updateAlumnoWithApoderado(alumnoDocumentId, apoderadoDocumentId);
    } catch (error) {
      console.error(`Error estableciendo relación Alumno -> Apoderado:`, error);
      throw new Error(`No se pudo establecer la relación del alumno con el apoderado`);
    }
    
    try {
      await updateApoderadoWithAlumno(apoderadoDocumentId, alumnoDocumentId);
    } catch (error) {
      // No lanzamos error aquí porque la relación principal ya está establecida
    }
    
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
    
    const errorDetails = error.message || "Error desconocido";
    
    return NextResponse.json(
      { 
        error: "Error al registrar datos",
        message: errorDetails,
      },
      { status: 500 }
    );
  }
}

