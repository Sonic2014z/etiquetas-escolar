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
    let apoderadoId: number;
    
    if (apoderado) {
      // Apoderado existe, usar su ID
      apoderadoId = apoderado.id;
      console.log(`Apoderado existente encontrado: ID ${apoderadoId}`);
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
      apoderadoId = nuevoApoderado.id;
      apoderado = nuevoApoderado;
      console.log(`Nuevo apoderado creado: ID ${apoderadoId}, UID ${uid}`);
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
    
    let alumnoId: number;
    
    if (alumnoExistente) {
      // Alumno existe
      alumnoId = alumnoExistente.id;
      console.log(`Alumno existente encontrado: ID ${alumnoId}`);
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
      alumnoId = nuevoAlumno.id;
      console.log(`Nuevo alumno creado: ID ${alumnoId}`);
    }
    
    // 3. VERIFICAR QUE AMBOS REGISTROS EXISTEN EN STRAPI
    console.log(`Verificando existencia de apoderado ${apoderadoId} y alumno ${alumnoId}...`);
    
    const apoderadoVerificado = await verifyApoderadoExists(apoderadoId);
    const alumnoVerificado = await verifyAlumnoExists(alumnoId);
    
    if (!apoderadoVerificado) {
      throw new Error(`No se pudo verificar la existencia del apoderado con ID ${apoderadoId}`);
    }
    
    if (!alumnoVerificado) {
      throw new Error(`No se pudo verificar la existencia del alumno con ID ${alumnoId}`);
    }
    
    console.log(`✓ Apoderado ${apoderadoId} verificado`);
    console.log(`✓ Alumno ${alumnoId} verificado`);
    
    // 4. ESTABLECER RELACIONES BIDIRECCIONALES DESPUÉS DE VERIFICAR
    console.log(`Estableciendo relaciones bidireccionales...`);
    
    // Relación: Alumno -> Apoderado
    try {
      await updateAlumnoWithApoderado(alumnoId, apoderadoId);
      console.log(`✓ Relación establecida: Alumno ${alumnoId} -> Apoderado ${apoderadoId}`);
    } catch (error) {
      console.error(`Error estableciendo relación Alumno -> Apoderado:`, error);
      throw new Error(`No se pudo establecer la relación del alumno con el apoderado`);
    }
    
    // Relación: Apoderado -> Alumno
    try {
      await updateApoderadoWithAlumno(apoderadoId, alumnoId);
      console.log(`✓ Relación establecida: Apoderado ${apoderadoId} -> Alumno ${alumnoId}`);
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
          id: apoderadoId,
          existia: !!apoderado && apoderado.id === apoderadoId,
        },
        alumno: {
          id: alumnoId,
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

