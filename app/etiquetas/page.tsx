'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from 'lucide-react';
import { StudentCard } from '@/components/label/StudentCard';
import { SimpleLabel } from '@/components/label/SimpleLabel';
import { SubjectLabel } from '@/components/label/SubjectLabel';
import { logger } from "@/lib/helpers/logger";

interface StudentInfo {
  name: string;
  grade: string;
  school: string;
  location: string;
  year: string;
  orderNumber: string;
  guardian: string;
  qrUrl?: string;
}

// Colores para StudentCard y SimpleLabel (alternando por fila) - Actualizados
const colors = [
  '#9E2488', // MORADO
  '#164296', // AZUL
  '#FFC403', // AMARILLO
  '#EA5936', // NARANJO
];

// Asignaturas con sus colores (según diseño oficial) - Actualizados
const subjectRows = [
  // Fila 1: 5 asignaturas completas
  [
    { name: 'Matemática', color: '#164296' }, // AZUL
    { name: 'Lenguaje', color: '#9E2488' }, // MORADO
    { name: 'Historia', color: '#EA5936' }, // NARANJO
    { name: 'Ciencias', color: '#FFC403' }, // AMARILLO
    { name: 'Artes', color: '#164296' }, // AZUL
  ],
  // Fila 2: 5 asignaturas completas
  [
    { name: 'Matemática', color: '#164296' }, // AZUL
    { name: 'Lenguaje', color: '#9E2488' }, // MORADO
    { name: 'Historia', color: '#EA5936' }, // NARANJO
    { name: 'Ciencias', color: '#FFC403' }, // AMARILLO
    { name: 'Música', color: '#164296' }, // AZUL
  ],
  // Fila 3: 2 asignaturas (Biología, Física)
  [
    { name: 'Biología', color: '#164296' }, // AZUL
    { name: 'Física', color: '#9E2488' }, // MORADO
  ],
  // Fila 4: 2 asignaturas (Biología, Física)
  [
    { name: 'Biología', color: '#164296' }, // AZUL
    { name: 'Física', color: '#9E2488' }, // MORADO
  ],
  // Fila 5: 2 asignaturas (Química azul, Química púrpura) - SOLO 2 etiquetas de Química en total
  [
    { name: 'Química', color: '#164296' }, // AZUL
    { name: 'Química', color: '#9E2488' }, // MORADO
  ],
];

function EtiquetasContent() {
  const searchParams = useSearchParams();
  const [studentData, setStudentData] = useState<StudentInfo | null>(null);

  // Sanea texto proveniente de query params o storage para evitar caracteres peligrosos y longitudes excesivas
  const sanitizeText = (value: string | null | undefined, maxLength: number, fallback: string): string => {
    if (!value) return fallback;

    // Eliminar caracteres de control
    let clean = value.replace(/[\x00-\x1F\x7F]/g, "").trim();

    if (!clean) return fallback;

    // Bloquear caracteres potencialmente peligrosos
    if (/[<>"'{}\[\]\\|`~]/.test(clean)) {
      return fallback;
    }

    if (clean.length > maxLength) {
      clean = clean.slice(0, maxLength);
    }

    return clean;
  };

  const safeDecode = (value: string | null): string | null => {
    if (value == null) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  useEffect(() => {
    // Intentar obtener datos de query params
    const rawStudentName = searchParams.get('studentName');
    const rawStudentGrade = searchParams.get('studentGrade');
    const rawStudentSchool = searchParams.get('studentSchool');
    const rawStudentLocation = searchParams.get('studentLocation');
    const rawStudentYear = searchParams.get('studentYear');
    const rawOrderNumber = searchParams.get('orderNumber');
    const rawGuardian = searchParams.get('guardian');
    const rawQrUrl = searchParams.get('qrUrl');

    const studentName = safeDecode(rawStudentName);
    const studentGrade = safeDecode(rawStudentGrade);
    const studentSchool = safeDecode(rawStudentSchool);
    const studentLocation = safeDecode(rawStudentLocation);
    const studentYear = safeDecode(rawStudentYear);
    const orderNumber = safeDecode(rawOrderNumber);
    const guardian = safeDecode(rawGuardian);
    const qrUrl = safeDecode(rawQrUrl);

    if (studentName && studentGrade && studentSchool) {
      // Combinar school y location si location existe
      const fullSchoolNameRaw = studentLocation 
        ? `${studentSchool} ${studentLocation}`.trim()
        : studentSchool;

      const safeName = sanitizeText(studentName, 100, "Alumno");
      const safeGrade = sanitizeText(studentGrade, 50, "");
      const safeSchool = sanitizeText(fullSchoolNameRaw, 120, "Colegio");
      const safeLocation = studentLocation ? sanitizeText(studentLocation, 80, "") : "";
      const safeGuardian = guardian ? sanitizeText(guardian, 100, "") : "";
      const safeOrderNumber = sanitizeText(orderNumber || "", 20, Math.floor(Math.random() * 100000000).toString().padStart(8, '0'));
      const safeQrUrl = qrUrl && !/[<>"'{}\[\]\\|`~]/.test(qrUrl) ? qrUrl : undefined;
      
      setStudentData({
        name: safeName,
        grade: safeGrade || " ",
        school: safeSchool,
        location: safeLocation,
        year: sanitizeText(studentYear || "", 10, new Date().getFullYear().toString()),
        orderNumber: safeOrderNumber,
        guardian: safeGuardian,
        qrUrl: safeQrUrl,
      });
    } else {
      // Intentar obtener de sessionStorage como fallback (con manejo de errores)
      try {
        // Intentar obtener por índice si existe
        const studentIndex = searchParams.get('studentIndex');
        let stored: string | null = null;
        
        if (studentIndex) {
          // Buscar datos específicos del estudiante por índice
          const keys = Object.keys(sessionStorage);
          const studentKey = keys.find(key => key.startsWith(`etiquetasData_${studentIndex}_`));
          if (studentKey) {
            stored = sessionStorage.getItem(studentKey);
          }
        }
        
        // Si no se encontró por índice, intentar el fallback general
        if (!stored) {
          stored = sessionStorage.getItem('etiquetasData');
        }
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setStudentData(parsed);
          } catch (e) {
            // Error al parsear datos de sessionStorage (no crítico)
            logger.error('Error parsing stored data:', e);
          }
        }
      } catch (e) {
        // sessionStorage puede no estar disponible (modo privado, etc.)
        logger.warn('No se pudo acceder a sessionStorage:', e);
      }
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Cargando datos de la etiqueta...</p>
          <p className="text-sm text-gray-500">Si no se cargan los datos, por favor regresa al formulario.</p>
        </div>
      </div>
    );
  }

  // Preparar datos para los componentes
  const studentCardData = {
    name: studentData.name,
    grade: studentData.grade,
    school: studentData.school,
    year: studentData.year,
    qrUrl: studentData.qrUrl,
  };

  const simpleLabelData = {
    grade: studentData.grade,
    name: studentData.name,
  };

  const orderData = {
    orderNumber: studentData.orderNumber,
    guardian: studentData.guardian,
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:p-0">
      {/* Header con botón de descarga */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Etiquetas Escolares</h1>
              <p className="text-sm text-gray-600 mt-1">Vista previa de las etiquetas para impresión</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 print:px-0 print:py-0 print:w-full print:max-w-none">
        {/* Contenedor principal con tamaño carta (Letter: 8.5" × 11" = 216mm × 279mm) */}
        <div 
          className="mx-auto preview-completa-container print:m-0 print:w-full print:max-w-none print:h-auto" 
          style={{ 
            width: '816px', // 8.5" × 96 DPI = 816px
            height: 'auto', // Altura automática en vista previa
            maxWidth: '100%',
            backgroundColor: 'white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '0',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'avoid', // Evitar salto de página después
          }}
        >
          {/* Contenido del PDF con márgenes internos simulando página carta */}
          <div 
            className="w-full print:bg-transparent" 
            style={{ 
              height: 'auto',
              pageBreakAfter: 'avoid', // Evitar salto de página después
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: '8mm 10mm', // Márgenes de carta en vista previa, en impresión se usa @page margin
              boxSizing: 'border-box',
            }}
          >
          
          {/* SECCIÓN 1: StudentCard - Etiquetas de estudiantes con QR */}
          <div className="mb-6 print:mb-1" style={{ pageBreakInside: 'avoid' }}>
            <div
              className="grid grid-cols-3"
              style={{
                pageBreakInside: 'avoid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                // Sin espacio entre etiquetas: el borde interno actúa como guía de corte
                gap: 0,
                width: '100%',
              }}
            >
              {Array.from({ length: 21 }).map((_, idx) => {
                // Dimensiones base de la etiqueta según Figma (definidas en StudentCard)
                const bleed = 19; // mismo bleed que en StudentCard
                const labelWidth = 980;
                const labelHeight = 340;
                const baseWidth = labelWidth + bleed * 2;   // 1018px
                const baseHeight = labelHeight + bleed * 2; // 378px

                // Escala para que quepan holgadamente 3 columnas y 7 filas en la página carta
                const scale = 0.22;

                // Colores alternando por fila: todas las etiquetas de la misma fila tienen el mismo color
                const rowIndex = Math.floor(idx / 3); // 3 columnas por fila
                // Patrón de colores por fila: púrpura, azul, amarillo, naranja, púrpura, azul, amarillo
                const rowColors = [
                  '#9c2986', // purple - fila 1
                  '#164293', // blue - fila 2
                  '#fdc30a', // yellow - fila 3
                  '#eb5836', // orange - fila 4
                  '#9c2986', // purple - fila 5
                  '#164293', // blue - fila 6
                  '#fdc30a', // yellow - fila 7
                ];
                const colorHex = rowColors[rowIndex];

                return (
                  <div
                    key={idx}
                    style={{
                      width: '100%',
                      height: baseHeight * scale,
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: baseWidth,
                        height: baseHeight,
                        flexShrink: 0,
                      }}
                    >
                      <StudentCard
                        student={studentCardData}
                        colorHex={colorHex}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: SimpleLabel - Etiquetas simples */}
          <div className="mb-6 print:mb-1" style={{ pageBreakInside: 'avoid' }}>
            <div className="grid grid-cols-3 gap-0 print:gap-0" style={{ pageBreakInside: 'avoid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%' }}>
              {Array.from({ length: 12 }).map((_, idx) => {
                // Dimensiones base de la etiqueta según Figma (definidas en SimpleLabel)
                const bleed = 19; // mismo bleed que en SimpleLabel
                // Ancho reducido para que el bleed derecho se vea completo sin overflow
                const baseWidth = 960; // Reducido de 1000 a 960 para dar espacio al bleed
                const baseHeight = 130;
                const totalWidth = baseWidth + bleed * 2;   // 998px (antes 1038px)
                const totalHeight = baseHeight + bleed * 2; // 168px

                // Escala para que quepan 3 columnas en 816px de ancho (papel carta)
                const scale = 0.22;

                // Colores alternando por fila: púrpura, azul, amarillo (todas las etiquetas de la misma fila tienen el mismo color)
                const rowIndex = Math.floor(idx / 3);
                // Patrón por fila: púrpura (fila 1), azul (fila 2), amarillo (fila 3), púrpura (fila 4)
                const colorPattern = [
                  '#9c2986', // purple - fila 1
                  '#164293', // blue - fila 2
                  '#fdc30a', // yellow - fila 3
                  '#9c2986', // purple - fila 4
                ];
                const colorHex = colorPattern[rowIndex % colorPattern.length];

                return (
                  <div
                    key={idx}
                    style={{
                      width: '100%',
                      height: totalHeight * scale,
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: totalWidth,
                        height: totalHeight,
                        flexShrink: 0,
                      }}
                    >
                      <SimpleLabel
                        student={simpleLabelData}
                        colorHex={colorHex}
                        customWidth={960} // Ancho reducido para que el bleed derecho se vea completo
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 3: SubjectLabel - Etiquetas de asignaturas */}
          <div className="mb-4 print:mb-0" style={{ pageBreakInside: 'avoid' }}>
            <div className="space-y-0 print:space-y-0" style={{ pageBreakInside: 'avoid' }}>
              {subjectRows.map((row, rowIndex) => (
                <div 
                  key={rowIndex} 
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0px',
                    columnGap: '0px',
                    rowGap: '0px',
                    width: '100%', 
                    margin: 0, 
                    padding: 0,
                  }}
                >
                  {row.map((subject, idx) => {
                    // Dimensiones base de la etiqueta según Figma (definidas en SubjectLabel)
                    const bleed = 19; // mismo bleed que en SubjectLabel
                    const baseWidth = 540; // Tamaño original
                    const baseHeight = 160;
                    const totalWidth = baseWidth + bleed * 2;   // 698px
                    const totalHeight = baseHeight + bleed * 2; // 198px

                    // Usar la misma escala para ambos ejes para evitar distorsión
                    // Escala reducida a 0.20 para que quepa el footer y no se sobrepongan
                    const scale = 0.20;

                    return (
                      <div
                        key={`${rowIndex}-${idx}`}
                        style={{
                          width: '100%',
                          height: totalHeight * scale,
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            width: totalWidth,
                            height: totalHeight,
                            marginLeft: 'auto',
                            marginRight: 'auto',
                          }}
                        >
                          <SubjectLabel 
                            subject={subject.name} 
                            colorHex={subject.color} 
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Agregar espacios vacíos si la fila tiene menos de 5 asignaturas */}
                  {Array.from({ length: 5 - row.length }).map((_, idx) => (
                    <div key={`empty-${rowIndex}-${idx}`} aria-hidden="true" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER - Texto de agradecimiento en el espacio residual */}
          <div className="mt-4 print:mt-2 flex justify-between items-start print:items-start" style={{ pageBreakInside: 'avoid' }}>
            {/* Left side - Order info */}
            <div className="flex flex-col gap-1 print:gap-0.5">
              <p 
                className="text-black"
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                Orden n°: <span style={{ fontWeight: 'bold' }}>{orderData.orderNumber}</span> - Apoderado: <span style={{ fontWeight: 'bold' }}>{orderData.guardian}</span>
              </p>
            </div>

            {/* Right side - Thank you message and QR info */}
            <div className="flex flex-col items-end gap-2 print:gap-1.5">
              <p 
                className="text-black font-bold text-right"
                style={{
                  // Tamaño reducido para que quepa completo en el PDF
                  fontSize: '11px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                Gracias por confiar en Librería Escolar.
              </p>
              <p 
                className="text-black text-right"
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                Etiquetas con QR: Si se pierde, te avisan.
              </p>
              {/* Logo "escolar librería" - Agrandado */}
              <div className="flex items-end mt-1 print:mt-0.5">
                <img 
                  src="/logo.png" 
                  alt="Librería Escolar" 
                  style={{
                    height: 'auto',
                    width: 'auto',
                    maxHeight: '60px', // Logo agrandado
                    maxWidth: '200px', // Logo agrandado
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.logo-fallback');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                {/* Fallback de texto si la imagen no carga */}
                <div 
                  className="logo-fallback flex flex-col items-end"
                  style={{ display: 'none' }}
                >
                  <span 
                    className="font-bold lowercase"
                    style={{
                      fontSize: '14px',
                      color: '#164296',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    }}
                  >
                    escolar
                  </span>
                  <span 
                    className="font-bold lowercase"
                    style={{
                      fontSize: '12px',
                      color: '#164296',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      marginTop: '-2px',
                    }}
                  >
                    Librería
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EtiquetasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <EtiquetasContent />
    </Suspense>
  );
}
