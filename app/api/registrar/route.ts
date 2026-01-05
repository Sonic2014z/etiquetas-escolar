import { NextRequest, NextResponse } from "next/server";
import { findApoderadoByRut, createApoderado, updateApoderadoWithAlumno } from "@/lib/api/apoderados";
import { findAlumno, createAlumno } from "@/lib/api/alumnos";
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
        email: "", // El email no se está capturando en el formulario actual
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
      
      // Verificar si ya está relacionado con el apoderado
      const apoderadoRelacionado = alumnoExistente.attributes.apoderado?.data;
      if (!apoderadoRelacionado || apoderadoRelacionado.id !== apoderadoId) {
        // Si no está relacionado o está relacionado con otro apoderado, actualizamos
        // Nota: En Strapi, si un alumno ya tiene un apoderado, necesitarías actualizar el alumno
        // Por ahora, solo actualizamos el apoderado para agregar la relación
        await updateApoderadoWithAlumno(apoderadoId, alumnoId);
        console.log(`Relación actualizada: Apoderado ${apoderadoId} <-> Alumno ${alumnoId}`);
      }
    } else {
      // Crear nuevo alumno relacionado con el apoderado
      const nuevoAlumno = await createAlumno({
        nombres: studentData.nombres,
        primer_apellido: studentData.primerApellido,
        segundo_apellido: studentData.segundoApellido || "",
        curso: studentData.course,
        letra: studentData.letter,
        colegio: studentData.colegio,
        apoderadoId: apoderadoId,
      });
      alumnoId = nuevoAlumno.id;
      console.log(`Nuevo alumno creado: ID ${alumnoId}`);
      
      // Actualizar el apoderado para incluir la relación con el nuevo alumno
      await updateApoderadoWithAlumno(apoderadoId, alumnoId);
      console.log(`Relación creada: Apoderado ${apoderadoId} <-> Alumno ${alumnoId}`);
    }
    
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
    return NextResponse.json(
      { 
        error: "Error al registrar datos",
        message: error.message || "Error desconocido"
      },
      { status: 500 }
    );
  }
}

