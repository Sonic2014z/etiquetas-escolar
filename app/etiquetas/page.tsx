'use client';

import { useEffect, useState, Suspense, memo } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import type { ParentData, StudentData } from "@/types/label";
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

// Colores con valores hexadecimales para impresión (paleta actualizada)
// Patrón: púrpura, azul, amarillo (alternando por columna) - Actualizados
const colors = [
  { class: 'bg-purple-600', hex: '#9E2488' }, // MORADO
  { class: 'bg-blue-600', hex: '#164296' }, // AZUL
  { class: 'bg-yellow-400', hex: '#FFC403' }, // AMARILLO
  { class: 'bg-orange-500', hex: '#EA5936' }, // NARANJO
];

// Configuración consolidada de asignaturas por fila (paleta actualizada) - Actualizados
const subjectRows = [
  // Fila 1: 5 asignaturas completas
  [
    { name: 'Matemática', color: 'bg-blue-700', hex: '#164296' }, // AZUL
    { name: 'Lenguaje', color: 'bg-purple-600', hex: '#9E2488' }, // MORADO
    { name: 'Historia', color: 'bg-orange-500', hex: '#EA5936' }, // NARANJO
    { name: 'Ciencias', color: 'bg-yellow-400', hex: '#FFC403' }, // AMARILLO
    { name: 'Artes', color: 'bg-blue-700', hex: '#164296' }, // AZUL
  ],
  // Fila 2: 5 asignaturas completas
  [
    { name: 'Matemática', color: 'bg-blue-700', hex: '#164296' }, // AZUL
    { name: 'Lenguaje', color: 'bg-purple-600', hex: '#9E2488' }, // MORADO
    { name: 'Historia', color: 'bg-orange-500', hex: '#EA5936' }, // NARANJO
    { name: 'Ciencias', color: 'bg-yellow-400', hex: '#FFC403' }, // AMARILLO
    { name: 'Música', color: 'bg-blue-700', hex: '#164296' }, // AZUL
  ],
  // Fila 3: 2 asignaturas (Biología, Física)
  [
    { name: 'Biología', color: 'bg-blue-700', hex: '#164296' }, // AZUL
    { name: 'Física', color: 'bg-purple-600', hex: '#9E2488' }, // MORADO
  ],
  // Fila 4: 2 asignaturas (Biología, Física)
  [
    { name: 'Biología', color: 'bg-blue-700', hex: '#164296' }, // AZUL
    { name: 'Física', color: 'bg-purple-600', hex: '#9E2488' }, // MORADO
  ],
  // Fila 5: 2 asignaturas (Química azul, Química púrpura)
  [
    { name: 'Química', color: 'bg-blue-700', hex: '#164296' }, // AZUL
    { name: 'Química', color: 'bg-purple-600', hex: '#9E2488' }, // MORADO
  ],
  // Fila 6: 2 asignaturas adicionales para crear más espacio residual
  [
    { name: 'Química', color: 'bg-blue-700', hex: '#164296' }, // AZUL
    { name: 'Química', color: 'bg-purple-600', hex: '#9E2488' }, // MORADO
  ],
];

function EtiquetasContent() {
  const searchParams = useSearchParams();
  const [studentData, setStudentData] = useState<StudentInfo | null>(null);

  useEffect(() => {
    // Intentar obtener datos de query params
    const studentName = searchParams.get('studentName');
    const studentGrade = searchParams.get('studentGrade');
    const studentSchool = searchParams.get('studentSchool');
    const studentLocation = searchParams.get('studentLocation');
    const studentYear = searchParams.get('studentYear');
    const orderNumber = searchParams.get('orderNumber');
    const guardian = searchParams.get('guardian');
    const qrUrl = searchParams.get('qrUrl');

    if (studentName && studentGrade && studentSchool) {
      setStudentData({
        name: decodeURIComponent(studentName),
        grade: decodeURIComponent(studentGrade),
        school: decodeURIComponent(studentSchool),
        location: studentLocation ? decodeURIComponent(studentLocation) : '',
        year: studentYear || new Date().getFullYear().toString(),
        orderNumber: orderNumber || Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        guardian: guardian ? decodeURIComponent(guardian) : '',
        qrUrl: qrUrl ? decodeURIComponent(qrUrl) : undefined,
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
        // sessionStorage no disponible (no crítico, los datos están en query params)
        logger.warn('No se pudo acceder a sessionStorage:', e);
        // Continuar sin fallar, los datos deberían estar en query params
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

  return (
    <div className="max-w-[800px] mx-auto etiquetas-print-page">
      {/* Print Button */}
      <div className="mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Descargar o imprimir el PDF de las etiquetas"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Descargar PDF
        </button>
      </div>

      {/* Sheet Container */}
      <div className="bg-white p-8 print:p-2">
        {/* Main ID Cards Grid - 3 columns x 7 rows = 21 cards */}
        <div className="grid grid-cols-3 gap-1.5 mb-2 print:gap-1 print:mb-1.5 print:grid-cols-3">
          {Array.from({ length: 21 }).map((_, idx) => {
            // Colores alternando por columna: púrpura, azul, amarillo
            const columnIndex = idx % 3;
            const colorData = colors[columnIndex];
            return (
              <StudentCard
                key={idx}
                student={studentData}
                color={colorData.class}
                colorHex={colorData.hex}
              />
            );
          })}
        </div>

        {/* Simple Name Labels Grid - 5 columns x 3 rows = 15 labels */}
        <div className="grid grid-cols-5 gap-0.5 mb-2 print:gap-0.5 print:mb-1.5">
          {Array.from({ length: 15 }).map((_, idx) => {
            // Colores alternando por columna: púrpura, azul, amarillo, azul, púrpura
            const columnIndex = idx % 5;
            const colorPattern = [0, 1, 2, 1, 0]; // índices de colores: púrpura, azul, amarillo, azul, púrpura
            const colorIndex = colorPattern[columnIndex];
            const colorData = colors[colorIndex];
            
            return (
              <SimpleLabel
                key={idx}
                grade={studentData.grade}
                name={studentData.name}
                highlight={false}
                color={colorData.class}
                colorHex={colorData.hex}
              />
            );
          })}
        </div>

        {/* Subject Labels Section */}
        <div className="space-y-0.5 mb-3 print:space-y-0.5 print:mb-2">
          {subjectRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-0.5 print:gap-0.5">
              {row.map((subject, idx) => (
                <SubjectLabel 
                  key={`${rowIndex}-${idx}`} 
                  subject={subject.name} 
                  color={subject.color} 
                  colorHex={subject.hex} 
                />
              ))}
              {/* Agregar espacios vacíos si la fila tiene menos de 5 asignaturas */}
              {Array.from({ length: 5 - row.length }).map((_, idx) => (
                <div key={`empty-${idx}`} aria-hidden="true" />
              ))}
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="border-t pt-2 print:pt-1.5 print:border-t print:border-gray-300 flex items-start justify-between print:mt-0">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1 print:text-lg print:mb-1 print:leading-tight">
              Gracias por confiar en Librería Escolar.
            </h2>
            <p className="text-[9px] text-gray-600 print:text-[8px] print:mb-0.5 print:leading-tight">
              Etiquetas con QR: Si se pierde, te avisan.
            </p>
            <div className="text-[8px] text-gray-700 print:text-[8px] print:leading-tight print:mt-1">
              <p className="print:mb-0">Orden n°: {studentData.orderNumber}</p>
              <p className="print:mb-0">Apoderado: {studentData.guardian}</p>
            </div>
          </div>
          <div className="text-right flex items-end print:shrink-0 print:ml-1">
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
              <span className="text-lg font-bold print:text-base print:mb-0.5" style={{ color: '#164296' }}>escolar</span>
              <span className="text-xs print:text-[10px]" style={{ color: '#164296' }}>Librería</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StudentCard = memo(function StudentCard({ student, color, colorHex }: { student: StudentInfo; color: string; colorHex: string }) {
  // Generar datos para el QR
  const qrData = student.qrUrl || `${student.name}|${student.grade}|${student.school}|${student.orderNumber}`;
  
  // Dividir el nombre del colegio en dos líneas si es muy largo
  // Combinar school y location si location existe
  const fullSchoolName = student.location 
    ? `${student.school} ${student.location}`.trim()
    : (student.school || '');
  
  const colegioParts = fullSchoolName ? fullSchoolName.split(' ') : [];
  // Dividir en dos líneas de manera más inteligente
  const midPoint = Math.ceil(colegioParts.length / 2);
  const colegioLine1 = colegioParts.slice(0, midPoint).join(' ');
  const colegioLine2 = colegioParts.slice(midPoint).join(' ');
  
  // Extraer curso y letra del grade
  // El formato puede ser: "4° Básico A", "3° Medio B", "4° Básico", etc.
  let curso = student.grade || "Curso";
  let letra = "";
  
  // Buscar si hay una letra al final (después de un espacio)
  const gradeParts = student.grade ? student.grade.trim().split(/\s+/) : [];
  if (gradeParts.length > 0) {
    const lastPart = gradeParts[gradeParts.length - 1];
    // Si la última parte es una sola letra (A-Z), es la letra del curso
    if (lastPart.length === 1 && /^[A-Z]$/.test(lastPart)) {
      letra = lastPart;
      // El curso es todo lo demás
      curso = gradeParts.slice(0, -1).join(' ');
    } else {
      // No hay letra, el curso es todo el grade
      curso = student.grade;
      letra = "";
    }
  }
  
  return (
    <div 
      className="bg-white border border-black rounded overflow-hidden flex flex-row relative print:border-black w-full"
      style={{ 
        aspectRatio: '2.3/1',
        height: '100px',
        maxWidth: '100%'
      }}
    >
      {/* Franja vertical de color con texto "DEVOLVER AQUI" y QR Code - Bleed/descalce para impresión */}
      <div 
        className={`${color} flex flex-row items-center justify-center gap-2 p-2 relative shrink-0 h-full print:p-2`}
        style={{ 
          backgroundColor: colorHex, 
          width: '90px', 
          minWidth: '90px',
          // Bleed: extender el color más allá del borde para compensar descalce al cortar
          marginLeft: '-1px', // Extender hacia la izquierda
          marginTop: '-1px', // Extender hacia arriba
          marginBottom: '-1px', // Extender hacia abajo
        }}
      >
        {/* Texto vertical "DEVOLVER AQUI" a la izquierda */}
        <div className="shrink-0 flex items-center justify-center h-full">
          <span 
            className="text-white font-bold text-[6px] tracking-wider whitespace-nowrap print:text-[6px]"
            style={{ 
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)'
            }}
          >
            DEVOLVER AQUI
          </span>
        </div>
        
        {/* QR Code a la derecha del texto - Márgenes iguales arriba, abajo y derecha */}
        <div className="shrink-0" style={{ marginTop: '3px', marginBottom: '3px', marginRight: '3px' }}>
          {qrData ? (
            <div className="border border-white/30 p-1 rounded bg-white print:p-1" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              <QRCodeSVG 
                value={qrData}
                size={60}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
                className="print:w-[60px] print:h-[60px]"
              />
            </div>
          ) : (
            <div className="w-[62px] h-[62px] bg-white/20 border border-dashed border-white/50 rounded flex items-center justify-center text-center p-1 print:w-[62px] print:h-[62px]">
              <span className="text-[6px] text-white font-medium print:text-[6px]">Faltan datos</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal - área blanca */}
      <div className="flex-1 flex flex-col items-start p-2 print:p-2">
        {/* Información del alumno y colegio */}
        <div className="flex-1 min-w-0 flex flex-col justify-start w-full h-full">
          {/* Nombre del alumno - Achicado y con margen superior aumentado */}
          <h3 className="text-[10px] leading-tight text-black mb-0.5 print:text-[10px] print:mb-0.5" style={{ marginTop: '4px' }}>
            {student.name || "Nombre del Alumno"}
          </h3>

          {/* Curso y letra - Sin bold */}
          <div className="flex items-baseline gap-1 mb-1 print:mb-1">
            <span className="text-[9px] text-black print:text-[9px]" style={{ fontWeight: 'normal' }}>
              {curso}{letra ? ` ${letra}` : ''}
            </span>
            {/* Línea separadora corta y delgada debajo del curso */}
            <div 
              className="bg-black"
              style={{
                width: '28px',
                height: '1px',
                marginTop: '1px',
              }}
            />
          </div>

          {/* Nombre del colegio en dos líneas con año y ESCOLAR */}
          <div className="flex flex-col gap-0 mt-auto print:mt-auto min-w-0">
            <div className="flex items-baseline gap-1 print:gap-1 min-w-0">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[7px] text-black leading-tight print:text-[7px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {colegioLine1 || "Nombre del"}
                </span>
                {colegioLine2 && colegioLine2.trim() && (
                  <span className="text-[7px] text-black leading-tight print:text-[7px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {colegioLine2}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-0.5 shrink-0 print:gap-0.5">
                <span className="text-[7px] text-black print:text-[7px] whitespace-nowrap">
                  {new Date().getFullYear()}
                </span>
                <img 
                  src="/logo.png" 
                  alt="escolar" 
                  style={{
                    height: '12px', // Logo agrandado
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.logo-fallback');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'inline';
                    }
                  }}
                />
                <span className="text-[7px] font-bold print:text-[7px] whitespace-nowrap logo-fallback" style={{ color: '#164296', display: 'none' }}>
                  escolar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const SimpleLabel = memo(function SimpleLabel({ grade, name, highlight, color, colorHex }: { grade: string; name: string; highlight: boolean; color?: string; colorHex?: string }) {
  // Extraer curso y letra del grade de forma consistente con StudentCard
  // El formato puede ser: "4° Básico A", "3° Medio B", "4° Básico", etc.
  let curso = grade || "";
  let letra = "";
  
  if (grade) {
    const gradeParts = grade.trim().split(/\s+/);
    if (gradeParts.length > 0) {
      const lastPart = gradeParts[gradeParts.length - 1];
      // Si la última parte es una sola letra (A-Z), es la letra del curso
      if (lastPart.length === 1 && /^[A-Z]$/.test(lastPart)) {
        letra = lastPart;
        // El curso es todo lo demás
        curso = gradeParts.slice(0, -1).join(' ');
      } else {
        // No hay letra, el curso es todo el grade
        curso = grade;
        letra = "";
      }
    }
  }
  
  return (
    <div className="border border-gray-300 rounded overflow-hidden flex items-center text-[7px] print:text-[7px] print:border-gray-300" style={{ height: '24px' }}>
      {/* Franja vertical de color */}
      {colorHex && (
        <div 
          className={`${color || ''} w-1 shrink-0 print:w-1`}
          style={{ backgroundColor: colorHex, minHeight: '100%' }}
        />
      )}
      {/* Contenido de texto */}
      <div className="px-1 py-0.5 flex items-center gap-1 flex-1 print:px-1 print:py-0.5 print:gap-1">
        <span 
          className={highlight ? 'bg-yellow-300 px-0.5' : ''}
          style={highlight ? { backgroundColor: '#fde047' } : {}}
        >
          {curso}{letra ? ` ${letra}` : ''}
        </span>
        <span className="font-semibold">{name}</span>
      </div>
    </div>
  );
});

const SubjectLabel = memo(function SubjectLabel({ subject, color, colorHex }: { subject: string; color: string; colorHex: string }) {
  return (
    <div 
      className={`${color} text-white text-center py-1 flex items-center justify-center px-1 print:py-0.5 print:px-1 gap-1`}
      style={{ backgroundColor: colorHex, height: '20px' }}
    >
      <span className="text-[8px] font-bold print:text-[8px]">{subject}</span>
      <span className="text-[6px] font-bold text-blue-700 print:text-[6px]" style={{ color: '#1e40af' }}>escolar</span>
    </div>
  );
});

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
