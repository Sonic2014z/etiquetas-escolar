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
import { generateIntermediateQRUrl } from "@/lib/helpers/qr-hash";
import { Colegio } from "@/types/strapi";
import { getColegios } from "@/lib/api/colegios";
import dynamic from "next/dynamic";

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

  const [studentsData, setStudentsData] = useState<StudentData[]>([{
    nombres: "",
    primerApellido: "",
    segundoApellido: "",
    course: "", // Iniciamos vacío para obligar selección
    letter: "",
    colegio: ""
  }]);


  // --- 2. ESTADO DE VALIDACIÓN ---
  const [isRutValid, setIsRutValid] = useState<boolean | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loadingColegios, setLoadingColegios] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ show: boolean; missingFields: string[] }>({ show: false, missingFields: [] });
  const [confirmationAlert, setConfirmationAlert] = useState<{ show: boolean; missingFields: string[] }>({ show: false, missingFields: [] });
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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
  // Agregar un nuevo formulario de alumno vacío
  const addStudentForm = () => {
    setStudentsData(prev => [...prev, {
      nombres: "",
      primerApellido: "",
      segundoApellido: "",
      course: "",
      letter: "",
      colegio: ""
    }]);
    
    // Hacer scroll suave hacia el nuevo formulario después de un pequeño delay
    setTimeout(() => {
      const newFormElement = document.getElementById(`student-form-${studentsData.length}`);
      if (newFormElement) {
        newFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Eliminar un formulario de alumno por índice
  const removeStudentForm = (index: number) => {
    if (studentsData.length > 1) {
      setStudentsData(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Actualizar un alumno específico por índice
  const handleStudentChange = (index: number, field: keyof StudentData, value: string) => {
    setStudentsData(prev => prev.map((student, i) => 
      i === index ? { ...student, [field]: value } : student
    ));
  };

  // --- 5. LÓGICA DE NEGOCIO (QR & PDF) ---
  const whatsappNumber = getWhatsAppNumber(parentData.phone);
  const isPhoneValid = whatsappNumber.length === 11; // 569XXXXXXXX

  // Generar datos para cada vista previa de alumno
  const studentsPreviewData = studentsData.map((student) => {
    const studentFullName = `${student.nombres} ${student.primerApellido} ${student.segundoApellido}`.trim();
    const colegioSeleccionado = colegios.find(
      (c) => c.id.toString() === student.colegio
    );
    const colegioNombre = colegioSeleccionado?.colegio_nombre || "Seleccione un colegio";
    
    // Construir mensaje específico para este alumno
    const message = `Hola ${parentData.nombres}, encontré un útil escolar perteneciente a ${student.nombres} ${student.primerApellido} ${student.segundoApellido} del curso ${student.course} ${student.letter}.`;
    
    // URL final del QR (solo si hay teléfono válido)
    const qrUrl = isPhoneValid 
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      : undefined;
    
    return {
      studentFullName,
      curso: student.course,
      letra: student.letter,
      colegioNombre,
      qrUrl,
    };
  });

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
    setStudentsData([{
      nombres: "",
      primerApellido: "",
      segundoApellido: "",
      course: "",
      letter: "",
      colegio: ""
    }]);
    setIsRutValid(null);
    setFormErrors({});
  };

  // Función para validar teléfono y correo antes de registrar
  const validateContactInfo = (): string[] => {
    const missingFields: string[] = [];
    
    // Validar teléfono
    if (!parentData.phone || !parentData.phone.trim()) {
      missingFields.push('Teléfono del apoderado');
    }
    
    // Validar correo electrónico
    if (!parentData.email || !parentData.email.trim()) {
      missingFields.push('Correo electrónico del apoderado');
    }
    
    return missingFields;
  };

  // Función para proceder con el registro (después de confirmar)
  const proceedWithRegistration = async () => {
    // Ocultar alerta de confirmación
    setConfirmationAlert({ show: false, missingFields: [] });
    
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
          studentsData: studentsData.map((student) => {
            const colegioSeleccionado = colegios.find(
              (c) => c.id.toString() === student.colegio
            );
            const colegioNombre = colegioSeleccionado?.colegio_nombre || "";
            
            return {
              nombres: student.nombres,
              primerApellido: student.primerApellido,
              segundoApellido: student.segundoApellido,
              course: student.course,
              letter: student.letter,
              colegio: colegioNombre, // Enviamos el nombre del colegio como string
            };
          }),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Construir mensaje de error detallado
        let errorMessage = result.error || result.message || 'Error al registrar';
        
        if (result.detalles && Array.isArray(result.detalles)) {
          errorMessage += '\n\nDetalles:\n' + result.detalles.join('\n');
        } else if (result.detalles && result.detalles.alumnosFallidos && result.detalles.alumnosFallidos.length > 0) {
          errorMessage += '\n\nAlumnos que fallaron:\n';
          result.detalles.alumnosFallidos.forEach((alumno: any) => {
            errorMessage += `- ${alumno.nombre}: ${alumno.error}\n`;
          });
        }
        
        throw new Error(errorMessage);
      }

      // Manejar éxito parcial o completo
      if (result.partial) {
        // Éxito parcial: algunos alumnos se registraron, otros fallaron
        let mensaje = result.message || 'Registro parcial completado';
        
        if (result.data && result.data.alumnosFallidos && result.data.alumnosFallidos.length > 0) {
          mensaje += '\n\nAlumnos que fallaron:\n';
          result.data.alumnosFallidos.forEach((alumno: any) => {
            mensaje += `- ${alumno.nombre}: ${alumno.error}\n`;
          });
        }
        
        setRegisterMessage({
          type: 'error', // Mostrar como error para que el usuario vea que hay problemas
          text: mensaje,
        });
        
        // No limpiar el formulario en caso de éxito parcial para que el usuario pueda corregir
      } else {
        // Éxito completo
        setRegisterMessage({
          type: 'success',
          text: result.message || 'Registro completado exitosamente',
        });

        // Abrir página de etiquetas para cada alumno registrado exitosamente
        if (result.data && result.data.alumnosExitosos && result.data.alumnosExitosos.length > 0) {
          // Esperar un momento antes de abrir las ventanas para que el usuario vea el mensaje
          setTimeout(() => {
            result.data.alumnosExitosos.forEach((alumno: any, index: number) => {
              // Buscar los datos del alumno en studentsData
              const studentData = studentsData.find(
                s => `${s.nombres} ${s.primerApellido} ${s.segundoApellido}`.trim() === alumno.nombre
              );
              
              if (studentData) {
                // Usar la misma lógica que DownloadPdfButton pero con URL intermediaria
                openEtiquetasPage(studentData, index);
              }
            });
          }, 1000);
        } else {
          // Si no hay información de alumnos exitosos, abrir para todos los alumnos
          setTimeout(() => {
            studentsData.forEach((student, index) => {
              openEtiquetasPage(student, index);
            });
          }, 1000);
        }

        // Limpiar el formulario después de un registro exitoso completo
        resetForm();
      }

      // Ocultar el mensaje después de 8 segundos (más tiempo para mensajes parciales)
      setTimeout(() => {
        setRegisterMessage(null);
      }, 8000);

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

  // Función para abrir la página de etiquetas
  const openEtiquetasPage = (student: StudentData, index: number) => {
    const currentYear = new Date().getFullYear();
    const studentFullName = `${student.nombres} ${student.primerApellido} ${student.segundoApellido}`.trim();
    const courseText = `${student.course} ${student.letter}`;
    const parentFullName = `${parentData.nombres} ${parentData.primerApellido}`;
    
    // Obtener datos de la vista previa
    const previewData = studentsPreviewData[index];
    if (!previewData) return;
    
    // Dividir el nombre del colegio si es necesario
    const colegioParts = previewData.colegioNombre.split(' ');
    const colegioLine1 = colegioParts.slice(0, Math.ceil(colegioParts.length / 2)).join(' ');
    const colegioLine2 = colegioParts.slice(Math.ceil(colegioParts.length / 2)).join(' ');
    
    // Generar número de orden
    const orderNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    // Generar URL intermediaria del QR si existe qrUrl
    let finalQrUrl = previewData.qrUrl;
    if (finalQrUrl && parentData.phone) {
      // Obtener la URL base (usar window.location.origin en cliente)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      // Generar URL intermediaria usando los datos (ya incluye query params)
      finalQrUrl = generateIntermediateQRUrl({
        studentName: studentFullName,
        studentGrade: courseText,
        parentPhone: parentData.phone,
        parentName: parentData.nombres,
      }, baseUrl);
    }
    
    // Construir URL con query params
    const params = new URLSearchParams({
      studentName: studentFullName,
      studentGrade: courseText,
      studentSchool: colegioLine1,
      studentLocation: colegioLine2,
      studentYear: currentYear.toString(),
      orderNumber: orderNumber,
      guardian: parentFullName,
      ...(finalQrUrl && { qrUrl: finalQrUrl }),
    });
    
    // Guardar también en sessionStorage como backup
    const etiquetasData = {
      name: studentFullName,
      grade: courseText,
      school: colegioLine1,
      location: colegioLine2,
      year: currentYear.toString(),
      orderNumber: orderNumber,
      guardian: parentFullName,
      qrUrl: finalQrUrl,
    };
    sessionStorage.setItem('etiquetasData', JSON.stringify(etiquetasData));
    
    // Abrir en nueva ventana para imprimir
    const url = `/etiquetas?${params.toString()}`;
    window.open(url, '_blank');
  };

  // Función para validar campos obligatorios
  const validateRequiredFields = (): { errors: { [key: string]: string }; missingFields: string[] } => {
    const errors: { [key: string]: string } = {};
    const missingFields: string[] = [];
    
    // Mapeo de campos a nombres amigables
    const fieldNames: { [key: string]: string } = {
      'nombres': 'Nombres del apoderado',
      'primerApellido': 'Primer apellido del apoderado',
      'rut': 'RUT del apoderado',
      'phone': 'Teléfono del apoderado',
      'nombresAlumno': 'Nombres del alumno',
      'primerApellidoAlumno': 'Primer apellido del alumno',
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
    // Segundo apellido es opcional, no se valida
    // RUT ya no es obligatorio, solo validamos si está presente
    if (parentData.rut && isRutValid === false) {
      errors['rut'] = "RUT Inválido";
      missingFields.push(fieldNames['rut'] + " (inválido)");
    }
    if (!parentData.phone) {
      errors['phone'] = "Teléfono requerido";
      missingFields.push(fieldNames['phone']);
    }
    // Validar cada alumno
    studentsData.forEach((student, index) => {
      const studentNumber = studentsData.length > 1 ? ` ${index + 1}` : '';
      
      if (!student.nombres) {
        errors[`student_${index}_nombres`] = "Requerido";
        missingFields.push(`Alumno${studentNumber}: Nombres`);
      }
      if (!student.primerApellido) {
        errors[`student_${index}_primerApellido`] = "Requerido";
        missingFields.push(`Alumno${studentNumber}: Primer apellido`);
      }
      // Segundo apellido es opcional, no se valida
      if (!student.course) {
        errors[`student_${index}_course`] = "Selecciona un curso";
        missingFields.push(`Alumno${studentNumber}: Curso`);
      }
      if (!student.letter) {
        errors[`student_${index}_letra`] = "Falta letra";
        missingFields.push(`Alumno${studentNumber}: Letra`);
      }
      if (!student.colegio) {
        errors[`student_${index}_colegio`] = "Selecciona un colegio";
        missingFields.push(`Alumno${studentNumber}: Colegio`);
      }
    });

    return { errors, missingFields };
  };

  // Función para mostrar el modal de confirmación (solo si los campos están validados)
  const handleRegister = () => {
    // Ocultar alertas previas
    setValidationAlert({ show: false, missingFields: [] });
    setConfirmationAlert({ show: false, missingFields: [] });
    setRegisterMessage(null);
    
    // Validar campos obligatorios primero
    const { errors, missingFields } = validateRequiredFields();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Mostrar alerta de validación (amarilla) si hay campos faltantes
      setValidationAlert({ show: true, missingFields });
      
      // Hacer scroll suave hacia la alerta después de un pequeño delay
      setTimeout(() => {
        const alertElement = document.getElementById('validation-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return; // No mostrar el modal si hay campos faltantes
    }

    // Si todos los campos obligatorios están completos, mostrar el modal de confirmación
    setShowConfirmationModal(true);
  };

  // Función para proceder después de confirmar en el modal
  const handleConfirmRegistration = async () => {
    // Cerrar el modal
    setShowConfirmationModal(false);
    
    // Ocultar alerta de validación al presionar el botón (se mostrará de nuevo si hay errores)
    setValidationAlert({ show: false, missingFields: [] });
    setConfirmationAlert({ show: false, missingFields: [] });
    
    // Validar teléfono y correo antes de proceder
    const missingContactInfo = validateContactInfo();
    
    if (missingContactInfo.length > 0) {
      // Mostrar alerta de confirmación
      setConfirmationAlert({ show: true, missingFields: missingContactInfo });
      
      // Hacer scroll suave hacia la alerta después de un pequeño delay
      setTimeout(() => {
        const alertElement = document.getElementById('confirmation-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return;
    }

    // Si no hay campos faltantes, proceder directamente
    proceedWithRegistration();
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
             <p className="text-foreground-secondary mt-1 font-medium text-sm">
              Los campos marcados con <strong className="text-error">*</strong> son obligatorios.
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

        {/* Alerta de confirmación (Teléfono y Correo) */}
        {confirmationAlert.show && confirmationAlert.missingFields.length > 0 && (
          <div 
            id="confirmation-alert"
            className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg shadow-md animate-fade-in"
          >
            <div className="flex items-start">
              <div className="shrink-0">
                <span className="text-orange-400 text-2xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-orange-800 mb-2">
                  Advertencia: Campos de contacto faltantes
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  [PLACEHOLDER: Mensaje de advertencia personalizable]
                </p>
                <p className="text-sm text-orange-700 mb-2">
                  Los siguientes campos no están completos:
                </p>
                <ul className="list-disc list-inside text-sm text-orange-700 space-y-1 mb-4">
                  {confirmationAlert.missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={proceedWithRegistration}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Continuar de todas formas
                  </button>
                  <button
                    onClick={() => setConfirmationAlert({ show: false, missingFields: [] })}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <button
                onClick={() => setConfirmationAlert({ show: false, missingFields: [] })}
                className="ml-4 shrink-0 text-orange-400 hover:text-orange-600 transition-colors"
                aria-label="Cerrar alerta"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  ¿Los datos que ha proporcionado son correctos?
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>RECORDAR:</strong> No cambie su actual número de teléfono, ya que si esto pasa, el código QR no funcionará correctamente.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                  Volver atrás
                </button>
                <button
                  onClick={handleConfirmRegistration}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
                >
                  Confirmo
                </button>
              </div>
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
                
                {/* Formularios de Alumnos */}
                {studentsData.map((student, index) => (
                  <div key={index} id={`student-form-${index}`} className="relative">
                    {studentsData.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudentForm(index)}
                        className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                        aria-label={`Eliminar alumno ${index + 1}`}
                        title="Eliminar este alumno"
                      >
                        <span className="text-lg">×</span>
                      </button>
                    )}
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-foreground-secondary">
                        {studentsData.length > 1 ? `Alumno ${index + 1}` : 'Datos del Alumno'}
                      </h3>
                    </div>
                    <AlumnoForm 
                        nombres={student.nombres}
                        primerApellido={student.primerApellido}
                        segundoApellido={student.segundoApellido}
                        curso={student.course}
                        letra={student.letter}
                        colegio={student.colegio}
                        colegios={colegios}
                        loadingColegios={loadingColegios}
                        onNombresChange={(val) => handleStudentChange(index, 'nombres', val)}
                        onPrimerApellidoChange={(val) => handleStudentChange(index, 'primerApellido', val)}
                        onSegundoApellidoChange={(val) => handleStudentChange(index, 'segundoApellido', val)}
                        onCursoChange={(val) => handleStudentChange(index, 'course', val)}
                        onLetraChange={(val) => handleStudentChange(index, 'letter', val)}
                        onColegioChange={(val) => handleStudentChange(index, 'colegio', val)}
                        errors={{ 
                            nombres: formErrors[`student_${index}_nombres`],
                            primerApellido: formErrors[`student_${index}_primerApellido`],
                            segundoApellido: formErrors[`student_${index}_segundoApellido`],
                            curso: formErrors[`student_${index}_course`], 
                            letra: formErrors[`student_${index}_letra`],
                            colegio: formErrors[`student_${index}_colegio`]
                        }}
                    />
                  </div>
                ))}

                {/* Botón para agregar más alumnos */}
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={addStudentForm}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    <span>Agregar otro alumno</span>
                  </button>
                </div>
            </div>

            {/* COLUMNA DERECHA: Vistas Previas (5 cols) */}
            <div className="lg:col-span-5">
                {/* Contenedor sticky que incluye las vistas previas y el botón */}
                <div className="sticky top-6 space-y-6">
                    {/* Título general de vistas previas */}
                    {studentsData.length > 1 && (
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold text-foreground-secondary">
                          Vistas Previas ({studentsData.length} {studentsData.length === 1 ? 'etiqueta' : 'etiquetas'})
                        </h2>
                      </div>
                    )}
                    
                    {/* Vistas previas para cada alumno */}
                    {studentsPreviewData.map((previewData, index) => (
                      <div key={index} className="space-y-2">
                        {studentsData.length > 1 && (
                          <div className="mb-2">
                            <h3 className="text-sm font-semibold text-foreground-secondary">
                              Etiqueta {index + 1} - {studentsData[index].nombres} {studentsData[index].primerApellido}
                            </h3>
                          </div>
                        )}
                        <LabelPreview 
                            nombreAlumno={previewData.studentFullName}
                            curso={previewData.curso}
                            letra={previewData.letra}
                            colegio={previewData.colegioNombre}
                            rutApoderado={parentData.rut}
                            telefonoApoderado={parentData.phone}
                            qrUrl={previewData.qrUrl}
                        />
                        
                      </div>
                    ))}

                    {/* Botón de Acción Principal */}
                    <div className="flex justify-center pt-4">
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
                          <span>📝 Registrar {studentsData.length > 1 ? `(${studentsData.length} alumnos)` : ''}</span>
                        )}
                      </button>
                    </div>
                </div>

                {/* Mensaje de registro */}
                {registerMessage && (
                  <div className={`mt-8 p-4 rounded-lg ${
                    registerMessage.type === 'success' 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    <div className="font-semibold mb-2">
                      {registerMessage.type === 'success' ? '✓ ' : '✗ '}
                      {registerMessage.type === 'success' ? 'Registro Exitoso' : 'Error en el Registro'}
                    </div>
                    <div className="text-sm whitespace-pre-line">
                      {registerMessage.text}
                    </div>
                  </div>
                )}

            </div>

        </div>
      </div>
    </main>
  );
}