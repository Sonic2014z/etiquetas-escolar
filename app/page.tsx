'use client';

import { useState, useEffect } from "react";
import { ParentData, StudentData } from "@/types/label";
import { ApoderadoForm } from "@/components/forms/ApoderadoForm";
import { AlumnoForm } from "@/components/forms/AlumnoForm";
import { LabelPreview } from "@/components/label/LabelPreview";
import { Logo } from "@/components/ui/Logo";
import { validateRut } from "@/lib/validations/rut";
import { formatRutOnType } from "@/lib/formatters/rut";
import { getWhatsAppNumber } from "@/lib/helpers/common";
import { Colegio } from "@/types/strapi";
import { getColegios } from "@/lib/api/colegios";

export default function GeneratorPage() {
  // --- 1. ESTADO DE DATOS ---
  const [parentData, setParentData] = useState<ParentData>({
    nombres: "",
    primerApellido: "",
    segundoApellido: "",
    rut: "",
    phone: "",
    email: ""
  });

  const [studentData, setStudentData] = useState<StudentData>({
    nombres: "",
    primerApellido: "",
    segundoApellido: "",
    course: "", // Iniciamos vacío para obligar selección
    letter: "",
    colegio: ""
  });

  // --- 2. ESTADO DE VALIDACIÓN ---
  const [isRutValid, setIsRutValid] = useState<boolean | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loadingColegios, setLoadingColegios] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ show: boolean; missingFields: string[] }>({ show: false, missingFields: [] });

  // --- 2.1. CARGAR COLEGIOS DESDE STRAPI ---
  useEffect(() => {
    const loadColegios = async () => {
      setLoadingColegios(true);
      try {
        const colegiosData = await getColegios();
        setColegios(colegiosData);
      } catch (error) {
        console.error("Error cargando colegios:", error);
        setColegios([]);
      } finally {
        setLoadingColegios(false);
      }
    };

    loadColegios();
  }, []);

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
  
  // Obtener el nombre del colegio seleccionado
  const colegioSeleccionado = colegios.find(
    (c) => c.id.toString() === studentData.colegio
  );
  const colegioNombre = colegioSeleccionado?.colegio_nombre || "Seleccione un colegio";

  // Función para limpiar el formulario
  const resetForm = () => {
    setParentData({
      nombres: "",
      primerApellido: "",
      segundoApellido: "",
      rut: "",
      phone: "",
      email: ""
    });
    setStudentData({
      nombres: "",
      primerApellido: "",
      segundoApellido: "",
      course: "",
      letter: "",
      colegio: ""
    });
    setIsRutValid(null);
    setFormErrors({});
  };

  // Función para registrar en Strapi
  const handleRegister = async () => {
    // Ocultar alerta de validación al presionar el botón (se mostrará de nuevo si hay errores)
    setValidationAlert({ show: false, missingFields: [] });
    
    // Validaciones finales antes de registrar
    const errors: { [key: string]: string } = {};
    const missingFields: string[] = [];
    
    // Mapeo de campos a nombres amigables
    const fieldNames: { [key: string]: string } = {
      'nombres': 'Nombres del apoderado',
      'primerApellido': 'Primer apellido del apoderado',
      'segundoApellido': 'Segundo apellido del apoderado',
      'rut': 'RUT del apoderado',
      'phone': 'Teléfono del apoderado',
      'nombresAlumno': 'Nombres del alumno',
      'primerApellidoAlumno': 'Primer apellido del alumno',
      'segundoApellidoAlumno': 'Segundo apellido del alumno',
      'course': 'Curso del alumno',
      'letra': 'Letra del curso',
      'colegio': 'Colegio del alumno',
    };

    if (!parentData.nombres) {
      errors['nombres'] = "Requerido";
      missingFields.push(fieldNames['nombres']);
    }
    if (!parentData.primerApellido) {
      errors['primerApellido'] = "Requerido";
      missingFields.push(fieldNames['primerApellido']);
    }
    if (!parentData.segundoApellido) {
      errors['segundoApellido'] = "Requerido";
      missingFields.push(fieldNames['segundoApellido']);
    }
    if (isRutValid === false) {
      errors['rut'] = "RUT Inválido";
    } else if (!parentData.rut) {
      errors['rut'] = "Requerido";
      missingFields.push(fieldNames['rut']);
    }
    if (!parentData.phone) {
      errors['phone'] = "Teléfono requerido";
      missingFields.push(fieldNames['phone']);
    }
    if (!studentData.nombres) {
      errors['nombresAlumno'] = "Requerido";
      missingFields.push(fieldNames['nombresAlumno']);
    }
    if (!studentData.primerApellido) {
      errors['primerApellidoAlumno'] = "Requerido";
      missingFields.push(fieldNames['primerApellidoAlumno']);
    }
    if (!studentData.segundoApellido) {
      errors['segundoApellidoAlumno'] = "Requerido";
      missingFields.push(fieldNames['segundoApellidoAlumno']);
    }
    if (!studentData.course) {
      errors['course'] = "Selecciona un curso";
      missingFields.push(fieldNames['course']);
    }
    if (!studentData.letter) {
      errors['letra'] = "Falta letra";
      missingFields.push(fieldNames['letra']);
    }
    if (!studentData.colegio) {
      errors['colegio'] = "Selecciona un colegio";
      missingFields.push(fieldNames['colegio']);
    }

    setFormErrors(errors);
    setRegisterMessage(null);

    if (Object.keys(errors).length > 0) {
      // Mostrar alerta de validación
      setValidationAlert({ show: true, missingFields });
      
      // Hacer scroll suave hacia la alerta después de un pequeño delay
      setTimeout(() => {
        const alertElement = document.getElementById('validation-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch('/api/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentData: {
            nombres: parentData.nombres,
            primerApellido: parentData.primerApellido,
            segundoApellido: parentData.segundoApellido,
            rut: parentData.rut,
            phone: parentData.phone,
            email: parentData.email,
          },
          studentData: {
            nombres: studentData.nombres,
            primerApellido: studentData.primerApellido,
            segundoApellido: studentData.segundoApellido,
            course: studentData.course,
            letter: studentData.letter,
            colegio: colegioNombre, // Enviamos el nombre del colegio como string
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Error al registrar');
      }

      // Éxito
      setRegisterMessage({
        type: 'success',
        text: result.message || 'Registro completado exitosamente',
      });

      // Limpiar el formulario después de un registro exitoso
      resetForm();

      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        setRegisterMessage(null);
      }, 5000);

    } catch (error: any) {
      console.error('Error al registrar:', error);
      setRegisterMessage({
        type: 'error',
        text: error.message || 'Error al registrar los datos. Por favor, intenta nuevamente.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <Logo className="mb-2" />
             <br/>
             <p className="text-foreground-secondary mt-1 font-bold text-lg">
               Formulario de Registro de Apoderados y Alumnos.
             </p>
           </div>
        </div>

        {/* Alerta de validación */}
        {validationAlert.show && validationAlert.missingFields.length > 0 && (
          <div 
            id="validation-alert"
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-md animate-fade-in"
          >
            <div className="flex items-start">
              <div className="shrink-0">
                <span className="text-yellow-400 text-2xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-yellow-800 mb-2">
                  Por favor, completa los siguientes campos requeridos:
                </h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {validationAlert.missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setValidationAlert({ show: false, missingFields: [] })}
                className="ml-4 shrink-0 text-yellow-400 hover:text-yellow-600 transition-colors"
                aria-label="Cerrar alerta"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
        )}

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
                    email={parentData.email}
                    
                    onNombresChange={(val: string) => handleParentChange('nombres', val)}
                    onPrimerApellidoChange={(val: string) => handleParentChange('primerApellido', val)}
                    onSegundoApellidoChange={(val: string) => handleParentChange('segundoApellido', val)}
                    onRutChange={(val: string) => handleParentChange('rut', val)}
                    onPhoneChange={(val: string) => handleParentChange('phone', val)}
                    onEmailChange={(val: string) => handleParentChange('email', val)}
                    
                    isRutValid={isRutValid}
                    errors={{ 
                      rut: formErrors['rut'],
                      nombres: formErrors['nombres'],
                      primerApellido: formErrors['primerApellido'],
                      segundoApellido: formErrors['segundoApellido'],
                      phone: formErrors['phone']
                    }}
                />
                
                <AlumnoForm 
                    nombres={studentData.nombres}
                    primerApellido={studentData.primerApellido}
                    segundoApellido={studentData.segundoApellido}
                    curso={studentData.course}
                    letra={studentData.letter}
                    colegio={studentData.colegio}
                    colegios={colegios}
                    loadingColegios={loadingColegios}
                    onNombresChange={(val) => handleStudentChange('nombres', val)}
                    onPrimerApellidoChange={(val) => handleStudentChange('primerApellido', val)}
                    onSegundoApellidoChange={(val) => handleStudentChange('segundoApellido', val)}
                    onCursoChange={(val) => handleStudentChange('course', val)}
                    onLetraChange={(val) => handleStudentChange('letter', val)}
                    onColegioChange={(val) => handleStudentChange('colegio', val)}
                    errors={{ 
                        nombres: formErrors['nombresAlumno'],
                        primerApellido: formErrors['primerApellidoAlumno'],
                        segundoApellido: formErrors['segundoApellidoAlumno'],
                        curso: formErrors['course'], 
                        letra: formErrors['letra'],
                        colegio: formErrors['colegio']
                    }}
                />
            </div>

            {/* COLUMNA DERECHA: Vista Previa (5 cols) */}
            <div className="lg:col-span-5">
                <LabelPreview 
                    nombreAlumno={studentFullName}
                    curso={studentData.course}
                    letra={studentData.letter}
                    colegio={colegioNombre}
                    rutApoderado={parentData.rut}
                    telefonoApoderado={parentData.phone}
                    qrUrl={qrUrl}
                />

                {/* Botón de Acción Principal */}
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="bg-primary hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 w-full md:w-auto"
                  >
                    {isRegistering ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Registrando...</span>
                      </>
                    ) : (
                      <span>📝 Registrar</span>
                    )}
                  </button>
                </div>

                {/* Mensaje de registro */}
                {registerMessage && (
                  <div className={`mt-8 p-4 rounded-lg ${
                    registerMessage.type === 'success' 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    <p className="font-semibold">
                      {registerMessage.type === 'success' ? '✓ ' : '✗ '}
                      {registerMessage.text}
                    </p>
                  </div>
                )}

            </div>

        </div>
      </div>
    </main>
  );
}