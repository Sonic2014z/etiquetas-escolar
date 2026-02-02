'use client';

import { useState, useEffect, useRef } from "react";
import { ParentData, StudentData } from "@/types/label";
import { ApoderadoForm } from "@/components/forms/ApoderadoForm";
import { AlumnoForm } from "@/components/forms/AlumnoForm";
import { LabelPreview } from "@/components/label/LabelPreview";
import { Logo } from "@/components/ui/Logo";
import { validateRut } from "@/lib/validations/rut";
import { formatRutOnType } from "@/lib/formatters/rut";
import { getWhatsAppNumber, validateEmail } from "@/lib/helpers/common";
import { generateIntermediateQRUrl } from "@/lib/helpers/qr-hash";
import { Colegio } from "@/types/strapi";
import { getColegios } from "@/lib/api/colegios";
import dynamic from "next/dynamic";
import { logger } from "@/lib/helpers/logger";
import { Loader2, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

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
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loadingColegios, setLoadingColegios] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ show: boolean; missingFields: string[] }>({ show: false, missingFields: [] });
  const [confirmationAlert, setConfirmationAlert] = useState<{ show: boolean; missingFields: string[] }>({ show: false, missingFields: [] });
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  // --- 3. ESTADO DE PROGRESO DE PDFs ---
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ completed: 0, total: 0 });
  const [pdfsCompleted, setPdfsCompleted] = useState(false);
  // Adjuntos de PDF para enviar en un solo email al finalizar (pdfUrl = enlace de descarga en el correo en vez de adjunto)
  const pdfEmailAttachmentsRef = useRef<{
    pdfBase64?: string;
    studentName: string;
    orderNumber: string;
    pdfUrl?: string;
  }[]>([]);

  // --- 2.0. EFECTO DE CONFETTI AL COMPLETAR PDFs ---
  useEffect(() => {
    if (pdfsCompleted) {
      // Lanzar confetti cuando se complete la generación de PDFs
      const duration = 3000; // 3 segundos
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Confetti desde la izquierda
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Confetti desde la derecha
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Cleanup: limpiar el intervalo si el componente se desmonta o pdfsCompleted cambia
      return () => {
        clearInterval(interval);
      };
    }
  }, [pdfsCompleted]);

  // --- 2.1. CARGAR COLEGIOS DESDE STRAPI ---
  useEffect(() => {
    const loadColegios = async () => {
      setLoadingColegios(true);
      try {
        const colegiosData = await getColegios();
        setColegios(colegiosData);
      } catch (error) {
        // Error cargando colegios (log solo en desarrollo)
        logger.error("Error cargando colegios:", error);
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
    
    // Si estamos editando el email, validamos al vuelo
    if (field === 'email') {
      if (value.trim() === '') {
        setIsEmailValid(null); // Campo vacío, no mostrar validación
      } else {
        setIsEmailValid(validateEmail(value));
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
      
      logger.log('Respuesta de /api/registrar:', {
        ok: response.ok,
        success: result.success,
        hasData: !!result.data,
        alumnosCount: result.data?.alumnos?.length || result.data?.alumnosExitosos?.length || 0,
      });

      if (!response.ok) {
        // Construir mensaje de error detallado
        let errorMessage = result.error || result.message || 'No pudimos completar el registro';
        
        // Detectar si el error es por caracteres especiales
        const errorText = JSON.stringify(result).toLowerCase();
        const hasSpecialCharsError = errorText.includes('caracteres especiales') || 
                                     errorText.includes('special characters') ||
                                     errorText.includes('no se permiten');
        
        if (hasSpecialCharsError) {
          errorMessage = 'Por favor, revisa los campos y elimina caracteres especiales como < > " \' { } [ ] \\ | ` ~';
        } else if (result.detalles && Array.isArray(result.detalles)) {
          // Verificar si algún detalle menciona caracteres especiales
          const detallesText = result.detalles.join(' ').toLowerCase();
          if (detallesText.includes('caracteres especiales') || detallesText.includes('no se permiten')) {
            errorMessage = 'Por favor, revisa los campos y elimina caracteres especiales como < > " \' { } [ ] \\ | ` ~';
          } else {
            errorMessage += '\n\nDetalles:\n' + result.detalles.join('\n');
          }
        } else if (result.detalles && result.detalles.alumnosFallidos && result.detalles.alumnosFallidos.length > 0) {
          errorMessage += '\n\nNo se pudieron registrar los siguientes alumnos:\n';
          result.detalles.alumnosFallidos.forEach((alumno: { index: number; nombre: string; error: string }) => {
            const friendlyError = alumno.error.toLowerCase().includes('caracteres especiales')
              ? 'Contiene caracteres especiales no permitidos'
              : alumno.error;
            errorMessage += `- ${alumno.nombre}: ${friendlyError}\n`;
          });
        }
        
        throw new Error(errorMessage);
      }

      // Manejar éxito parcial o completo
      if (result.partial) {
        // Éxito parcial: algunos alumnos se registraron, otros fallaron
        let mensaje = result.message || 'Registro parcial completado';
        
        if (result.data && result.data.alumnosFallidos && result.data.alumnosFallidos.length > 0) {
          mensaje += '\n\nNo se pudieron registrar los siguientes alumnos:\n';
          result.data.alumnosFallidos.forEach((alumno: { index: number; nombre: string; error: string }) => {
            const friendlyError = alumno.error.toLowerCase().includes('caracteres especiales')
              ? 'Contiene caracteres especiales no permitidos'
              : alumno.error;
            mensaje += `- ${alumno.nombre}: ${friendlyError}\n`;
          });
        }
        
        setRegisterMessage({
          type: 'error', // Mostrar como error para que el usuario vea que hay problemas
          text: mensaje,
        });
        
        // No limpiar el formulario en caso de éxito parcial para que el usuario pueda corregir
      } else {
        // Éxito completo
        const successMessage = result.message || 'Registro completado exitosamente';
        setRegisterMessage({
          type: 'success',
          text: `${successMessage}\n\nSe le enviará el PDF a su correo electrónico en breve.`,
        });

        // Abrir página de etiquetas y generar PDF para cada alumno registrado exitosamente
        // La API puede retornar 'alumnos' o 'alumnosExitosos' dependiendo del caso
        const alumnosRegistrados = result.data?.alumnosExitosos || result.data?.alumnos || [];
        
        if (alumnosRegistrados.length > 0) {
          // Reiniciar la colección de adjuntos de email para este registro
          pdfEmailAttachmentsRef.current = [];
          // Inicializar el banner de progreso
          setIsGeneratingPdfs(true);
          setPdfProgress({ completed: 0, total: alumnosRegistrados.length });
          
          // Esperar un momento antes de comenzar la generación de PDFs
          setTimeout(async () => {
            // Procesar PDFs secuencialmente
            for (let idx = 0; idx < alumnosRegistrados.length; idx++) {
              const alumno = alumnosRegistrados[idx];
              
              // Buscar los datos del alumno en studentsData
              const studentData = studentsData.find(
                s => `${s.nombres} ${s.primerApellido} ${s.segundoApellido}`.trim() === alumno.nombre
              );
              
              if (studentData) {
                // Obtener el índice correcto del estudiante
                const studentIndex = studentsData.findIndex(
                  s => `${s.nombres} ${s.primerApellido} ${s.segundoApellido}`.trim() === alumno.nombre
                );
                
                const finalIndex = studentIndex >= 0 ? studentIndex : idx;
                
                // Guardar QR code en Strapi (si existe)
                const previewData = studentsPreviewData[finalIndex];
                if (previewData && previewData.qrUrl && parentData.phone) {
                  const baseUrl = typeof window !== 'undefined' 
                    ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
                    : '';
                  
                  const studentFullName = `${studentData.nombres} ${studentData.primerApellido} ${studentData.segundoApellido}`.trim();
                  const courseText = `${studentData.course} ${studentData.letter}`;
                  
                  const qrData = {
                    studentName: studentFullName,
                    studentGrade: courseText,
                    parentPhone: parentData.phone,
                    parentName: parentData.nombres,
                  };
                  
                  // Generar URL intermediaria (solo hash)
                  const finalQrUrl = generateIntermediateQRUrl(qrData, baseUrl);
                  
                  // Extraer el hash de la URL y validar que existe
                  const hashMatch = finalQrUrl.match(/\/qr\/([a-f0-9]+)$/);
                  if (hashMatch && hashMatch[1]) {
                    const hash = hashMatch[1];
                    
                    // Almacenar los datos en Strapi (async, no bloquea)
                    fetch('/api/qr-codes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        hash: hash,
                        nombreAlumno: qrData.studentName,
                        cursoAlumno: qrData.studentGrade,
                        telefonoApoderado: qrData.parentPhone,
                        nombreApoderado: qrData.parentName,
                      }),
                    })
                    .then(async response => {
                      const responseData = await response.json().catch(() => ({}));
                      
                      if (!response.ok) {
                        logger.error('Error al guardar QR code:', {
                          status: response.status,
                          statusText: response.statusText,
                        });
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                    })
                    .catch(err => {
                      logger.error('Error guardando QR code (no crítico):', err instanceof Error ? err.message : 'Error desconocido');
                    });
                  }
                }
                
                // Validar que tenemos el documentId del alumno antes de generar PDF
                if (alumno.documentId && result.data.apoderado?.documentId) {
                  // Generar y subir PDF a Strapi (secuencialmente)
                  await generateAndUploadPDF(
                    studentData,
                    finalIndex,
                    result.data.apoderado.documentId,
                    alumno.documentId
                  );
                  
                  // Actualizar progreso
                  setPdfProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
                } else {
                  logger.warn('No se puede generar PDF: faltan documentIds', {
                    tieneApoderadoDocumentId: !!result.data.apoderado?.documentId,
                    tieneAlumnoDocumentId: !!alumno.documentId,
                  });
                  // Aún así actualizamos el progreso para no bloquear
                  setPdfProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
                }
              }
            }

            // Después de generar todos los PDFs, enviar un único correo con todos los adjuntos (si hay)
            try {
              if (
                pdfEmailAttachmentsRef.current.length > 0 &&
                result.data.apoderado?.documentId
              ) {
                await fetch("/api/send-pdfs-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    apoderadoDocumentId: result.data.apoderado.documentId,
                    attachments: pdfEmailAttachmentsRef.current,
                  }),
                });
              }
            } catch (error: unknown) {
              logger.error("Error enviando email combinado (no crítico):", {
                errorType: error instanceof Error ? error.constructor.name : "Unknown",
              });
            }
            
            // Marcar como completado y mostrar mensaje de éxito
            setPdfsCompleted(true);
            
            // Ocultar el banner después de mostrar el mensaje de éxito
            setTimeout(() => {
              setIsGeneratingPdfs(false);
              setPdfProgress({ completed: 0, total: 0 });
              setPdfsCompleted(false);
            }, 3000); // Mostrar el mensaje de éxito por 3 segundos
          }, 1000);
        } else {
          // Si no hay información de alumnos exitosos, no abrir páginas
          // El PDF se generará en background si tenemos los documentIds
          logger.warn('No se puede generar PDF: no hay información de alumnos registrados');
        }

        // Limpiar el formulario después de un registro exitoso completo
        resetForm();
      }

      // Ocultar el mensaje después de 8 segundos (más tiempo para mensajes parciales)
      setTimeout(() => {
        setRegisterMessage(null);
      }, 8000);

    } catch (error: any) {
      // Error al registrar (log solo en desarrollo, pero mostrar mensaje al usuario)
      logger.error('Error al registrar:', error);
      
      // Detectar si el error es por caracteres especiales
      const errorMessage = error.message || '';
      const hasSpecialCharsError = errorMessage.toLowerCase().includes('caracteres especiales') || 
                                   errorMessage.toLowerCase().includes('special characters') ||
                                   errorMessage.toLowerCase().includes('invalid characters');
      
      setRegisterMessage({
        type: 'error',
        text: hasSpecialCharsError 
          ? 'Por favor, revisa los campos y elimina caracteres especiales como < > " \' { } [ ] \\ | ` ~'
          : (errorMessage || 'No pudimos procesar tu registro en este momento. Por favor, verifica que todos los campos estén correctos e intenta nuevamente.'),
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
      // Obtener la URL base: priorizar variable de entorno, sino usar window.location.origin
      const baseUrl = typeof window !== 'undefined' 
        ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
        : '';
      
      // Preparar datos para el QR
      const qrData = {
        studentName: studentFullName,
        studentGrade: courseText,
        parentPhone: parentData.phone,
        parentName: parentData.nombres,
      };
      
      // Generar URL intermediaria (solo hash)
      finalQrUrl = generateIntermediateQRUrl(qrData, baseUrl);
      
      // Extraer el hash de la URL y validar que existe
      const hashMatch = finalQrUrl.match(/\/qr\/([a-f0-9]+)$/);
      if (hashMatch && hashMatch[1]) {
        const hash = hashMatch[1];
        
        // Guardando QR code en Strapi
        // Almacenar los datos en Strapi (async, no bloquea)
        // Nota: Este fetch es silencioso y no bloquea el flujo principal
        // Se podría agregar un estado de loading aquí si se necesita feedback visual
        const saveQRPromise = fetch('/api/qr-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hash: hash,
            nombreAlumno: qrData.studentName,
            cursoAlumno: qrData.studentGrade,
            telefonoApoderado: qrData.parentPhone,
            nombreApoderado: qrData.parentName,
          }),
        })
        .then(async response => {
          const responseData = await response.json().catch(() => ({}));
          
          if (!response.ok) {
            logger.error('Error al guardar QR code:', {
              status: response.status,
              statusText: response.statusText,
            });
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return responseData;
        })
        .then(data => {
          // QR guardado exitosamente (silencioso, no interrumpe el flujo)
          // En el futuro se podría agregar un indicador visual sutil aquí
          return { success: true, data };
        })
        .catch(err => {
          // Error al guardar QR (no crítico, el QR sigue funcionando)
          logger.error('Error storing QR data in Strapi (non-critical):', err instanceof Error ? err.message : 'Error desconocido');
          
          return { success: false, error: err };
        });
        
        // Guardar la promesa para posible uso futuro (ej: mostrar loading state)
        // Por ahora se ignora silenciosamente
      } else {
        // Error al extraer hash (no crítico, el QR seguirá funcionando con la URL completa)
        logger.error('Warning: No se pudo extraer el hash de la URL del QR');
      }
    }
    
    // Construir URL con query params (incluir índice para identificar estudiante)
    const params = new URLSearchParams({
      studentName: studentFullName,
      studentGrade: courseText,
      studentSchool: colegioLine1,
      studentLocation: colegioLine2,
      studentYear: currentYear.toString(),
      orderNumber: orderNumber,
      guardian: parentFullName,
      studentIndex: index.toString(), // Agregar índice para identificar múltiples estudiantes
      ...(finalQrUrl && { qrUrl: finalQrUrl }),
    });
    
    // Guardar también en sessionStorage como backup (con manejo de errores)
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
    
    try {
      // Usar índice único para cada estudiante para evitar sobrescritura
      const storageKey = `etiquetasData_${index}_${Date.now()}`;
      sessionStorage.setItem(storageKey, JSON.stringify(etiquetasData));
      // También guardar el último como fallback
      sessionStorage.setItem('etiquetasData', JSON.stringify(etiquetasData));
    } catch (e) {
      // sessionStorage puede fallar en modo privado o si está lleno
      // sessionStorage falló (no crítico, los datos están en query params)
      logger.warn('No se pudo guardar en sessionStorage:', e);
      // Continuar sin fallar, los datos están en query params
    }
    
    // Abrir en nueva ventana para imprimir
    const url = `/etiquetas?${params.toString()}`;
    window.open(url, '_blank');
  };

  // Función para generar y subir PDF a Strapi
  const generateAndUploadPDF = async (
    student: StudentData, 
    index: number, 
    apoderadoDocumentId: string,
    alumnoDocumentId: string
  ) => {
    try {
      const currentYear = new Date().getFullYear();
      const studentFullName = `${student.nombres} ${student.primerApellido} ${student.segundoApellido}`.trim();
      const courseText = `${student.course} ${student.letter}`;
      
      // Obtener datos de la vista previa
      const previewData = studentsPreviewData[index];
      if (!previewData) {
        logger.warn('No se encontraron datos de preview para generar PDF');
        return;
      }
      
      // Dividir el nombre del colegio si es necesario
      const colegioParts = previewData.colegioNombre.split(' ');
      const colegioLine1 = colegioParts.slice(0, Math.ceil(colegioParts.length / 2)).join(' ');
      const colegioLine2 = colegioParts.slice(Math.ceil(colegioParts.length / 2)).join(' ');
      
      // Obtener número de orden secuencial desde el backend
      let orderNumber: string;
      try {
        const orderResponse = await fetch('/api/generar-numero-orden');
        if (!orderResponse.ok) {
          throw new Error('Error al obtener número de orden');
        }
        const orderData = await orderResponse.json();
        orderNumber = orderData.numero_orden;
        logger.log(`Número de orden secuencial obtenido: ${orderNumber}`);
      } catch (error) {
        logger.error('Error obteniendo número de orden secuencial, usando fallback:', error);
        // Fallback: usar timestamp como número de orden temporal
        orderNumber = Date.now().toString().slice(-8).padStart(8, '0');
      }
      
      // Generar hash QR si existe
      let hash_qr = '';
      let finalQrUrl = previewData.qrUrl;
      
      if (finalQrUrl && parentData.phone) {
        const baseUrl = typeof window !== 'undefined' 
          ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
          : '';
        
        const qrData = {
          studentName: studentFullName,
          studentGrade: courseText,
          parentPhone: parentData.phone,
          parentName: parentData.nombres,
        };
        
        finalQrUrl = generateIntermediateQRUrl(qrData, baseUrl);
        const hashMatch = finalQrUrl.match(/\/qr\/([a-f0-9]+)$/);
        if (hashMatch && hashMatch[1]) {
          hash_qr = hashMatch[1];
        }
      }
      
      // Construir URL de etiquetas con query params
      const params = new URLSearchParams({
        studentName: studentFullName,
        studentGrade: courseText,
        studentSchool: colegioLine1,
        studentLocation: colegioLine2,
        studentYear: currentYear.toString(),
        orderNumber: orderNumber,
        guardian: `${parentData.nombres} ${parentData.primerApellido}`,
        studentIndex: index.toString(),
        ...(finalQrUrl && { qrUrl: finalQrUrl }),
      });
      
      const etiquetasUrl = `/etiquetas?${params.toString()}`;
      
      // Validar que tenemos todos los datos necesarios antes de llamar a la API
      if (!apoderadoDocumentId || !alumnoDocumentId) {
        logger.warn('No se puede generar PDF: faltan documentIds', {
          apoderadoDocumentId: !!apoderadoDocumentId,
          alumnoDocumentId: !!alumnoDocumentId,
        });
        return;
      }
      
      // Si no hay hash_qr, generar uno temporal o usar un valor por defecto
      const finalHashQr = hash_qr || `temp_${Date.now()}`;
      
      // Log sanitizado sin exponer información sensible
      logger.log('Llamando a /api/generar-pdf', {
        tieneApoderadoDocumentId: !!apoderadoDocumentId,
        tieneAlumnoDocumentId: !!alumnoDocumentId,
        tieneHashQr: !!finalHashQr,
        orderNumber: orderNumber, // Número de orden para la URL (no se envía al backend)
        año_escolar: currentYear,
      });
      
      // Llamar a la API para generar y subir PDF
      // NOTA: No enviamos numero_orden, el backend lo generará secuencialmente
      const response = await fetch('/api/generar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apoderadoDocumentId,
          alumnoDocumentId,
          hash_qr: finalHashQr,
          // numero_orden: NO se envía, el backend lo genera secuencialmente
          año_escolar: currentYear,
          colegio_nombre: previewData.colegioNombre,
          etiquetasUrl,
          studentName: studentFullName, // Nombre del estudiante para el email
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Error generando/subiendo PDF:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
        });
        // No mostrar error al usuario, es silencioso
        return;
      }
      
      const result = await response.json();
      logger.log('PDF generado y subido exitosamente:', {
        success: result.success,
        hasData: !!result.data,
        hasPdfBase64: !!result.pdfBase64,
      });

      // Guardar para enviar en un solo correo: base64 (fallback si no hay URL) y pdfUrl para enlace de descarga
      if (result.pdfBase64 || result.pdfUrl) {
        pdfEmailAttachmentsRef.current.push({
          ...(result.pdfBase64 && { pdfBase64: result.pdfBase64 as string }),
          studentName: studentFullName,
          orderNumber: (result.orderNumber ?? orderNumber).toString(),
          ...(result.pdfUrl && { pdfUrl: result.pdfUrl as string }),
        });
      }
      
    } catch (error: unknown) {
      // Error silencioso, no interrumpe el flujo del usuario
      logger.error('Error en generateAndUploadPDF (no crítico)', {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        hasMessage: !!(error instanceof Error ? error.message : false),
      });
    }
  };

  // Función para validar campos obligatorios
  // Función para validar caracteres especiales peligrosos
  const hasDangerousCharacters = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    
    // Caracteres peligrosos que no se permiten:
    // - Caracteres de control (ASCII 0-31 excepto tab, newline, carriage return)
    // - Caracteres especiales peligrosos: < > " ' & { } [ ] \ | ` ~
    // - Script tags y otros patrones peligrosos
    const dangerousPattern = /[<>"'{}\[\]\\|`~]|[\x00-\x08\x0B-\x0C\x0E-\x1F]/;
    
    return dangerousPattern.test(text);
  };

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

    // Validar caracteres peligrosos en campos de texto
    if (parentData.nombres && hasDangerousCharacters(parentData.nombres)) {
      errors['nombres'] = "Este campo no permite caracteres especiales";
      missingFields.push(fieldNames['nombres'] + " (contiene caracteres especiales)");
    } else if (!parentData.nombres) {
      errors['nombres'] = "Este campo es obligatorio";
      missingFields.push(fieldNames['nombres']);
    }
    
    if (parentData.primerApellido && hasDangerousCharacters(parentData.primerApellido)) {
      errors['primerApellido'] = "Este campo no permite caracteres especiales";
      missingFields.push(fieldNames['primerApellido'] + " (contiene caracteres especiales)");
    } else if (!parentData.primerApellido) {
      errors['primerApellido'] = "Este campo es obligatorio";
      missingFields.push(fieldNames['primerApellido']);
    }
    
    // Segundo apellido es opcional, pero validamos caracteres si está presente
    if (parentData.segundoApellido && hasDangerousCharacters(parentData.segundoApellido)) {
      errors['segundoApellido'] = "Este campo no permite caracteres especiales";
    }
    
    // RUT ya no es obligatorio, solo validamos si está presente
    if (parentData.rut && isRutValid === false) {
      errors['rut'] = "El RUT ingresado no es válido";
      missingFields.push(fieldNames['rut'] + " (inválido)");
    }
    
    if (!parentData.phone) {
      errors['phone'] = "El teléfono es obligatorio";
      missingFields.push(fieldNames['phone']);
    }
    
    // Validar email si está presente
    if (parentData.email && hasDangerousCharacters(parentData.email)) {
      errors['email'] = "Este campo no permite caracteres especiales";
    }
    // Validar cada alumno
    studentsData.forEach((student, index) => {
      const studentNumber = studentsData.length > 1 ? ` ${index + 1}` : '';
      
      if (student.nombres && hasDangerousCharacters(student.nombres)) {
        errors[`student_${index}_nombres`] = "Este campo no permite caracteres especiales";
        missingFields.push(`Alumno${studentNumber}: Nombres (contiene caracteres especiales)`);
      } else if (!student.nombres) {
        errors[`student_${index}_nombres`] = "Este campo es obligatorio";
        missingFields.push(`Alumno${studentNumber}: Nombres`);
      }
      
      if (student.primerApellido && hasDangerousCharacters(student.primerApellido)) {
        errors[`student_${index}_primerApellido`] = "Este campo no permite caracteres especiales";
        missingFields.push(`Alumno${studentNumber}: Primer apellido (contiene caracteres especiales)`);
      } else if (!student.primerApellido) {
        errors[`student_${index}_primerApellido`] = "Este campo es obligatorio";
        missingFields.push(`Alumno${studentNumber}: Primer apellido`);
      }
      
      // Segundo apellido es opcional, pero validamos caracteres si está presente
      if (student.segundoApellido && hasDangerousCharacters(student.segundoApellido)) {
        errors[`student_${index}_segundoApellido`] = "Este campo no permite caracteres especiales";
      }
      
      if (!student.course) {
        errors[`student_${index}_course`] = "Por favor, selecciona un curso";
        missingFields.push(`Alumno${studentNumber}: Curso`);
      }
      if (!student.letter) {
        errors[`student_${index}_letra`] = "Por favor, selecciona la letra del curso";
        missingFields.push(`Alumno${studentNumber}: Letra`);
      }
      if (!student.colegio) {
        errors[`student_${index}_colegio`] = "Por favor, selecciona un colegio";
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
      {/* Banner de progreso de PDFs */}
      {isGeneratingPdfs && (
        <div className={`fixed top-0 left-0 right-0 text-white shadow-lg z-50 transition-colors duration-500 ${
          pdfsCompleted ? 'bg-green-600' : 'bg-blue-600'
        }`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pdfsCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                <span className="font-medium">
                  {pdfsCompleted 
                    ? 'PDF generado correctamente' 
                    : `Generando PDFs... ${Math.round((pdfProgress.completed / pdfProgress.total) * 100)}%`
                  }
                </span>
              </div>
              {!pdfsCompleted && (
                <div className="text-sm">
                  {pdfProgress.completed} de {pdfProgress.total} completados
                </div>
              )}
            </div>
            <div className={`mt-2 w-full rounded-full h-2 ${
              pdfsCompleted ? 'bg-green-700' : 'bg-blue-700'
            }`}>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  pdfsCompleted ? 'bg-white' : 'bg-white'
                }`}
                style={{ width: `${(pdfProgress.completed / pdfProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className={`max-w-7xl mx-auto space-y-8 ${isGeneratingPdfs ? 'pt-20' : ''}`}>
        
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
           {/* Enlace temporal a demo de feedback - OCULTO */}
           {/* <a
             href="/demo-pdf-feedback"
             className="text-xs text-blue-600 hover:text-blue-800 underline"
             target="_blank"
             rel="noopener noreferrer"
           >
             🎨 Ver Demo: Feedback de Carga PDFs
           </a> */}
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

        {/* Mensaje de registro */}
        {registerMessage && (
          <div className={`p-4 rounded-lg shadow-md animate-fade-in ${
            registerMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border-l-4 border-green-400' 
              : 'bg-red-50 text-red-800 border-l-4 border-red-400'
          }`}>
            <div className="flex items-start">
              <div className="shrink-0">
                <span className={`text-2xl ${registerMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {registerMessage.type === 'success' ? '✓' : '✗'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-bold mb-2 ${registerMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {registerMessage.type === 'success' ? '¡Registro Exitoso!' : 'Problema al Registrar'}
                </h3>
                <div className="text-sm whitespace-pre-line">
                  {registerMessage.text}
                </div>
              </div>
              <button
                onClick={() => setRegisterMessage(null)}
                className={`ml-4 shrink-0 transition-colors ${registerMessage.type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}`}
                aria-label="Cerrar mensaje"
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
                  Uno o más campos de contacto no están completos. Por favor, complete los campos faltantes para continuar.
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
                    isEmailValid={isEmailValid}
                    errors={{ 
                      rut: formErrors['rut'],
                      nombres: formErrors['nombres'],
                      primerApellido: formErrors['primerApellido'],
                      segundoApellido: formErrors['segundoApellido'],
                      phone: formErrors['phone'],
                      email: formErrors['email']
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

                {/* Botones de acción */}
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  <button
                    type="button"
                    onClick={addStudentForm}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    <span>Agregar otro alumno</span>
                  </button>
                  <button 
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
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

            {/* COLUMNA DERECHA: Vistas Previas (5 cols) */}
            <div className="lg:col-span-5 w-full overflow-hidden">
                {/* Contenedor sticky que incluye las vistas previas y el botón */}
                <div className="lg:sticky lg:top-6 space-y-6 w-full max-w-full overflow-hidden">
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
                </div>

            </div>

        </div>
      </div>
    </main>
  );
}