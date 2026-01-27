'use client';

import { notFound } from 'next/navigation';
import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { StudentCard } from '@/components/label/StudentCard';
import { SimpleLabel } from '@/components/label/SimpleLabel';
import { SubjectLabel } from '@/components/label/SubjectLabel';

interface StudentInfo {
  name: string;
  grade: string;
  school: string;
  year: string;
  orderNumber: string;
  guardian: string;
  qrUrl?: string;
}

// Colores para StudentCard y SimpleLabel (mismo patrón que en /etiquetas)
const studentColors = [
  '#9E2488', // MORADO
  '#164296', // AZUL
  '#FFC403', // AMARILLO
  '#EA5936', // NARANJO
];

// Asignaturas con sus colores (según diseño oficial) - igual que en /etiquetas
const subjectRows = [
  [
    { name: 'Matemática', color: '#164296' },
    { name: 'Lenguaje', color: '#9E2488' },
    { name: 'Historia', color: '#EA5936' },
    { name: 'Ciencias', color: '#FFC403' },
    { name: 'Artes', color: '#164296' },
  ],
  [
    { name: 'Matemática', color: '#164296' },
    { name: 'Lenguaje', color: '#9E2488' },
    { name: 'Historia', color: '#EA5936' },
    { name: 'Ciencias', color: '#FFC403' },
    { name: 'Música', color: '#164296' },
  ],
  [
    { name: 'Biología', color: '#164296' },
    { name: 'Física', color: '#9E2488' },
  ],
  [
    { name: 'Biología', color: '#164296' },
    { name: 'Física', color: '#9E2488' },
  ],
  [
    { name: 'Química', color: '#164296' },
    { name: 'Química', color: '#9E2488' },
  ],
];

export default function PreviewCompletaPage() {
  // Página deshabilitada para producción
  notFound();
  
  // Datos de prueba fijos para previsualizar y generar PDFs
  const studentData: StudentInfo = {
    name: 'María José Mardones',
    grade: '1° Básico A',
    school: 'Colegio Tegualda',
    year: new Date().getFullYear().toString(),
    orderNumber: '00001234',
    guardian: 'Juan Pérez',
    qrUrl: undefined,
  };

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

  const handleGeneratePdfPreview = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        studentName: encodeURIComponent(studentData.name),
        studentGrade: encodeURIComponent(studentData.grade),
        studentSchool: encodeURIComponent(studentData.school),
        studentYear: studentData.year,
        orderNumber: studentData.orderNumber,
        guardian: encodeURIComponent(studentData.guardian),
      });

      const etiquetasUrl = `/etiquetas?${params.toString()}`;
      const apiParams = new URLSearchParams({ etiquetasUrl });

      const res = await fetch(`/api/generar-pdf-preview?${apiParams.toString()}`);
      if (!res.ok) {
        console.error('Error al generar PDF de prueba:', res.status, res.statusText);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error en handleGeneratePdfPreview:', error);
    }
  }, [studentData.name, studentData.grade, studentData.school, studentData.year, studentData.orderNumber, studentData.guardian]);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:p-0">
      {/* Header con botón de generación de PDF de prueba */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Preview Completa - PDF de Prueba</h1>
              <p className="text-sm text-gray-600 mt-1">
                Usa este diseño con datos de prueba para ajustar el PDF generado con Puppeteer antes de enviar correos.
              </p>
            </div>
            <button
              onClick={handleGeneratePdfPreview}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Generar PDF de prueba
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 print:px-0 print:py-0 print:w-full print:max-w-none">
        {/* Contenedor principal con tamaño carta (Letter: 8.5\" × 11\" = 216mm × 279mm) */}
        <div
          className="mx-auto preview-completa-container print:m-0 print:w-full print:max-w-none print:h-auto"
          style={{
            width: '816px', // 8.5\" × 96 DPI = 816px
            height: 'auto',
            maxWidth: '100%',
            backgroundColor: 'white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '0',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'avoid',
          }}
        >
          {/* Contenido del PDF con márgenes internos simulando página carta */}
          <div
            className="w-full print:bg-transparent"
            style={{
              height: 'auto',
              pageBreakAfter: 'avoid',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: '8mm 10mm',
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
                  gap: 0,
                  width: '100%',
                }}
              >
                {Array.from({ length: 21 }).map((_, idx) => {
                  const bleed = 19;
                  const labelWidth = 980;
                  const labelHeight = 340;
                  const baseWidth = labelWidth + bleed * 2;
                  const baseHeight = labelHeight + bleed * 2;

                  const scale = 0.22;

                  const rowIndex = Math.floor(idx / 3);
                  const rowColors = [
                    '#9c2986',
                    '#164293',
                    '#fdc30a',
                    '#eb5836',
                    '#9c2986',
                    '#164293',
                    '#fdc30a',
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
                        <StudentCard student={studentCardData} colorHex={colorHex} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: SimpleLabel - Etiquetas simples */}
            <div className="mb-6 print:mb-1" style={{ pageBreakInside: 'avoid' }}>
              <div
                className="grid grid-cols-3 gap-0 print:gap-0"
                style={{
                  pageBreakInside: 'avoid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  width: '100%',
                }}
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const bleed = 19;
                  const baseWidth = 960;
                  const baseHeight = 130;
                  const totalWidth = baseWidth + bleed * 2;
                  const totalHeight = baseHeight + bleed * 2;

                  const scale = 0.22;

                  const rowIndex = Math.floor(idx / 3);
                  const colorPattern = ['#9c2986', '#164293', '#fdc30a', '#9c2986'];
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
                          customWidth={960}
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
                      const bleed = 19;
                      const baseWidth = 540;
                      const baseHeight = 160;
                      const totalWidth = baseWidth + bleed * 2;
                      const totalHeight = baseHeight + bleed * 2;

                      const scale = 0.2;

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
                            <SubjectLabel subject={subject.name} colorHex={subject.color} />
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: 5 - row.length }).map((_, idx) => (
                      <div key={`empty-${rowIndex}-${idx}`} aria-hidden="true" />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER - Igual que en /etiquetas */}
            <div
              className="mt-4 print:mt-2 flex justify-between items-start print:items-start"
              style={{ pageBreakInside: 'avoid' }}
            >
              <div className="flex flex-col gap-1 print:gap-0.5">
                <p
                  className="text-black"
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  }}
                >
                  Orden n°: <span style={{ fontWeight: 'bold' }}>{orderData.orderNumber}</span> -
                  Apoderado: <span style={{ fontWeight: 'bold' }}>{orderData.guardian}</span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 print:gap-1.5">
                <p
                  className="text-black font-bold text-right"
                  style={{
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
                <div className="flex items-end mt-1 print:mt-0.5">
                  <img
                    src="/logo.png"
                    alt="Librería Escolar"
                    style={{
                      height: 'auto',
                      width: 'auto',
                      maxHeight: '60px',
                      maxWidth: '200px',
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.logo-fallback');
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
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
