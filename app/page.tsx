'use client';

import { useState } from "react";
import { ParentData, StudentData } from "@/types/label";
import { ApoderadoForm } from "@/components/forms/ApoderadoForm";
import { AlumnoForm } from "@/components/forms/AlumnoForm";
import { LabelPreview } from "@/components/label/LabelPreview";
import { validateRut } from "@/lib/validations/rut";
import { formatRutOnType } from "@/lib/formatters/rut";
import { getWhatsAppNumber } from "@/lib/helpers/common";

export default function GeneratorPage() {
  // --- 1. ESTADO DE DATOS ---
  const [parentData, setParentData] = useState<ParentData>({
    nombres: "",
    primerApellido: "",
    segundoApellido: "",
    rut: "",
    phone: ""
  });

  const [studentData, setStudentData] = useState<StudentData>({
    nombres: "",
    primerApellido: "",
    segundoApellido: "",
    course: "", // Iniciamos vacío para obligar selección
    letter: ""
  });

  // --- 2. ESTADO DE VALIDACIÓN ---
  const [isRutValid, setIsRutValid] = useState<boolean | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // --- 3. HANDLERS APODERADO ---
  const handleParentChange = (field: keyof ParentData, value: string) => {
    setParentData((prev: ParentData) => ({ ...prev, [field]: value }));
    
    // Si estamos editando el RUT, validamos al vuelo
    if (field === 'rut') {
      const formatted = formatRutOnType(value);
      setParentData((prev: ParentData) => ({ ...prev, rut: formatted }));
      
      if (formatted.length > 7) {
        setIsRutValid(validateRut(formatted));
      } else if (formatted.length === 0) {
        setIsRutValid(null);
      }
    }
  };

  // --- 4. HANDLERS ALUMNO ---
  const handleStudentChange = (field: keyof StudentData, value: string) => {
    setStudentData((prev: StudentData) => ({ ...prev, [field]: value }));
  };

  // --- 5. LÓGICA DE NEGOCIO (QR & PDF) ---
  const whatsappNumber = getWhatsAppNumber(parentData.phone);
  const isPhoneValid = whatsappNumber.length === 11; // 569XXXXXXXX

  // Construimos el mensaje predefinido
  const message = `Hola ${parentData.nombres}, encontré un útil escolar perteneciente a ${studentData.nombres} del curso ${studentData.course} ${studentData.letter}.`;
  
  // URL final del QR (solo si hay teléfono válido)
  const qrUrl = isPhoneValid 
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : undefined;

  // Nombre completo para la vista previa
  const studentFullName = `${studentData.nombres} ${studentData.primerApellido} ${studentData.segundoApellido}`.trim();
  
  // Colegio (por ahora hardcodeado, luego puede venir de configuración)
  const colegio = "Colegio Ejemplo";

  // Función simulada de descarga
  const handleDownload = () => {
    // Validaciones finales antes de imprimir
    const errors: { [key: string]: string } = {};
    if (!parentData.nombres) errors['nombres'] = "Requerido";
    if (isRutValid === false) errors['rut'] = "RUT Inválido";
    if (!studentData.course) errors['course'] = "Selecciona un curso";
    if (!studentData.letter) errors['letra'] = "Falta letra";

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      alert("¡Generando PDF! (Aquí iría la lógica de impresión)");
      window.print(); // Por ahora abrimos el diálogo de impresión del navegador
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold text-primary tracking-tight">Generador de Etiquetas</h1>
             <p className="text-foreground-secondary mt-1">
               Sistema de recuperación de útiles escolares mediante QR.
             </p>
           </div>
           
           {/* Botón de Acción Principal (Móvil y Desktop) */}
           <button 
             onClick={handleDownload}
             className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
           >
             <span>🖨️ Imprimir Etiqueta</span>
           </button>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: Formularios (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
                
                <ApoderadoForm 
                    nombres={parentData.nombres}
                    primerApellido={parentData.primerApellido}
                    segundoApellido={parentData.segundoApellido}
                    rut={parentData.rut}
                    phone={parentData.phone}
                    
                    onNombresChange={(val: string) => handleParentChange('nombres', val)}
                    onPrimerApellidoChange={(val: string) => handleParentChange('primerApellido', val)}
                    onSegundoApellidoChange={(val: string) => handleParentChange('segundoApellido', val)}
                    onRutChange={(val: string) => handleParentChange('rut', val)}
                    onPhoneChange={(val: string) => handleParentChange('phone', val)}
                    
                    isRutValid={isRutValid}
                    errors={{ rut: formErrors['rut'] }}
                />
                
                <AlumnoForm 
                    nombres={studentData.nombres}
                    primerApellido={studentData.primerApellido}
                    segundoApellido={studentData.segundoApellido}
                    curso={studentData.course}
                    letra={studentData.letter}

                    onNombresChange={(val) => handleStudentChange('nombres', val)}
                    onPrimerApellidoChange={(val) => handleStudentChange('primerApellido', val)}
                    onSegundoApellidoChange={(val) => handleStudentChange('segundoApellido', val)}
                    onCursoChange={(val) => handleStudentChange('course', val)}
                    onLetraChange={(val) => handleStudentChange('letter', val)}
                    
                    errors={{ 
                        curso: formErrors['course'], 
                        letra: formErrors['letra'] 
                    }}
                />
            </div>

            {/* COLUMNA DERECHA: Vista Previa (5 cols) */}
            <div className="lg:col-span-5">
                <LabelPreview 
                    nombreAlumno={studentFullName}
                    curso={studentData.course}
                    letra={studentData.letter}
                    colegio={colegio}
                    rutApoderado={parentData.rut}
                    telefonoApoderado={parentData.phone}
                    qrUrl={qrUrl}
                />

                {/* Debug Info (Opcional, para desarrollo) */}
                <div className="mt-8 p-4 bg-slate-100 rounded-lg text-xs font-mono text-slate-500 overflow-hidden">
                    <p className="font-bold mb-2">DEV INFO:</p>
                    <p>Phone Valid: {isPhoneValid ? 'YES' : 'NO'}</p>
                    <p>QR Link: {qrUrl || 'Pending...'}</p>
                </div>
            </div>

        </div>
      </div>
    </main>
  );
}