'use client';

import { QRCodeSVG } from 'qrcode.react';
import { memo } from 'react';

interface StudentCardPreviewProps {
  student: {
    name: string;
    grade: string;
    school: string;
    year?: string;
    qrUrl?: string;
  };
  colorHex: string; // Color de la franja izquierda
}

/**
 * Componente StudentCardPreview - Clon de StudentCard solo para la vista previa del formulario.
 * Esto nos permite ajustar el diseño de la vista previa sin afectar el diseño del PDF.
 */
export const StudentCardPreview = memo(function StudentCardPreview({ student, colorHex }: StudentCardPreviewProps) {
  // Sangrado de impresión (bleed) - 5mm = ~19px
  const bleed = 19;
  
  // Dimensiones base de la etiqueta (sin bleed)
  const labelWidth = 980;
  const labelHeight = 340;
  const leftSectionWidth = 337;
  
  // Generar datos para el QR
  const qrData = student.qrUrl || `${student.name}|${student.grade}|${student.school}`;
  
  // Dividir el nombre del colegio en dos líneas
  const fullSchoolName = student.school || '';
  let colegioLine1 = '';
  let colegioLine2 = '';
  
  const words = fullSchoolName.trim().split(/\s+/);
  
  if (words.length >= 2) {
    // Si tiene "Colegio" como primera palabra, tomar las primeras 2 palabras para la primera línea
    if (words[0].toLowerCase() === 'colegio' && words.length >= 2) {
      colegioLine1 = words.slice(0, 2).join(' '); // "Colegio Cardenal"
      colegioLine2 = words.slice(2).join(' '); // "Raul Silva Enriquez"
    } else {
      // Si no empieza con "Colegio", dividir por la mitad
      const midPoint = Math.ceil(words.length / 2);
      colegioLine1 = words.slice(0, midPoint).join(' ');
      colegioLine2 = words.slice(midPoint).join(' ');
    }
  } else {
    // Si solo tiene una palabra, ponerla en la primera línea y dejar la segunda vacía
    // para evitar que se duplique el texto en nombres de colegio cortos.
    colegioLine1 = fullSchoolName;
    colegioLine2 = '';
  }

  // Calcular el tamaño de fuente del nombre basado en su longitud
  const studentName = student.name || "Nombre del Alumno";
  const nameLength = studentName.length;
  
  let nameFontSize = 44;
  
  if (nameLength > 35) {
    nameFontSize = 28;
  } else if (nameLength > 30) {
    nameFontSize = 32;
  } else if (nameLength > 25) {
    nameFontSize = 36;
  } else if (nameLength > 20) {
    nameFontSize = 40;
  }

  const currentYear = student.year || new Date().getFullYear().toString();

  // Preparar líneas a mostrar para el colegio (misma lógica que en StudentCard).
  const hasSchoolName = fullSchoolName.trim().length > 0;
  const displayColegioLine1 = hasSchoolName ? colegioLine1 : "Nombre del";
  const displayColegioLine2 = hasSchoolName ? colegioLine2 : "Colegio";

  return (
    <div className="relative">
      {/* Contenedor de la etiqueta COMPLETA con sangrado extendido */}
      <div 
        className="flex w-full h-full overflow-visible relative"
        style={{
          width: `${labelWidth + bleed * 2}px`,
          height: `${labelHeight + bleed * 2}px`,
        }}
      >
        {/* Sección izquierda - Color con QR (extendida con bleed) */}
        <div 
          className="relative flex flex-col items-center justify-center"
          style={{
            width: `${leftSectionWidth + bleed * 2}px`,
            height: `${labelHeight + bleed * 2}px`,
            backgroundColor: colorHex,
          }}
        >
          {/* Texto vertical "DEVOLVER AQUI" */}
          <div 
            className="absolute flex items-center" 
            style={{ 
              left: `${20 + bleed}px`,
              top: '50%', 
              transform: 'translateY(-50%)',
            }}
          >
            <span 
              className="text-white font-semibold uppercase whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                fontSize: '22px',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              DEVOLVER AQUI
            </span>
          </div>
          
          {/* QR Code */}
          <div 
            className="bg-white shrink-0"
            style={{ 
              width: '210px',
              height: '210px',
              border: '3px solid white',
              marginLeft: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrData ? (
              <QRCodeSVG 
                value={qrData}
                size={204} // 210px - 6px de borde (3px * 2)
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                {/* Espacio vacío para QR */}
              </div>
            )}
          </div>
        </div>

        {/* Sección derecha - Blanca con información (extendida con bleed) */}
        <div 
          className="flex-1 bg-white flex flex-col justify-between relative"
          style={{
            height: `${labelHeight + bleed * 2}px`,
            paddingLeft: '40px',
            paddingRight: `${40 + bleed}px`,
            paddingTop: `${32 + bleed}px`,
            paddingBottom: `${32 + bleed}px`,
          }}
        >
          {/* Información del estudiante (parte superior) */}
          <div>
            {/* Nombre del alumno */}
            <h1 
              className="text-black font-bold leading-tight"
              style={{
                fontSize: `${nameFontSize}px`,
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                marginBottom: '12px', // un poco más de espacio debajo del nombre
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
              }}
            >
              {studentName}
            </h1>
            
            {/* Línea separadora */}
            <div 
              className="bg-black"
              style={{
                height: '4px',
                width: '120px',
                marginBottom: '24px', // separa aún más la línea del texto de curso
              }}
            />
            
            {/* Curso */}
            <h2 
              className="text-black font-normal"
              style={{
                fontSize: '36px',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                marginBottom: '28px', // un poco más de aire debajo del curso
              }}
            >
              {student.grade || "Curso"}
            </h2>
          </div>

          {/* Colegio, año y logo alineados en la parte inferior */}
          <div className="flex justify-between items-center">
            {/* Bloque izquierdo: colegio (2 líneas) + año */}
            <div className="flex items-center gap-8">
              <p 
                className="text-black leading-snug"
                style={{
                  fontSize: '20px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  lineHeight: '1.3',
                }}
              >
                {displayColegioLine1}
                <br />
                {hasSchoolName ? (colegioLine2 || '') : displayColegioLine2}
              </p>
              <div 
                className="text-black font-normal"
                style={{
                  fontSize: '32px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                {currentYear}
              </div>
            </div>
            
            {/* Bloque derecho: logo escolar */}
            <div style={{ width: '140px', height: '40px' }}>
              <img 
                src="/ESCOLAR.png" 
                alt="escolar" 
                style={{
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  // Fallback si la imagen no carga - usar SVG
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.logo-fallback');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'block';
                  }
                }}
              />
              {/* Fallback SVG del logo */}
              <svg 
                className="logo-fallback"
                width="140" 
                height="40" 
                viewBox="0 0 140 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'none' }}
              >
                <text 
                  x="0" 
                  y="30" 
                  style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' 
                  }}
                >
                  <tspan fill="#0066CC">e</tspan>
                  <tspan fill="#003399">scolar</tspan>
                </text>
                <circle cx="10" cy="15" r="8" fill="#0066CC" opacity="0.3"/>
                <circle cx="18" cy="15" r="8" fill="#003399" opacity="0.3"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Marco de corte DENTRO de la tarjeta */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: `${bleed}px`,
            left: `${bleed}px`,
            right: `${bleed}px`,
            bottom: `${bleed}px`,
            border: '2px solid #E91E63',
            borderRadius: '8px',
          }}
        >
          {/* Marcas de corte en las esquinas */}
          {/* Esquina superior izquierda */}
          <div className="absolute" style={{ top: '-1px', left: '-1px' }}>
            <div className="absolute bg-[#E91E63]" style={{ width: '20px', height: '2px', top: '0', left: '0' }}></div>
            <div className="absolute bg-[#E91E63]" style={{ width: '2px', height: '20px', top: '0', left: '0' }}></div>
          </div>
          
          {/* Esquina superior derecha */}
          <div className="absolute" style={{ top: '-1px', right: '-1px' }}>
            <div className="absolute bg-[#E91E63]" style={{ width: '20px', height: '2px', top: '0', right: '0' }}></div>
            <div className="absolute bg-[#E91E63]" style={{ width: '2px', height: '20px', top: '0', right: '0' }}></div>
          </div>
          
          {/* Esquina inferior izquierda */}
          <div className="absolute" style={{ bottom: '-1px', left: '-1px' }}>
            <div className="absolute bg-[#E91E63]" style={{ width: '20px', height: '2px', bottom: '0', left: '0' }}></div>
            <div className="absolute bg-[#E91E63]" style={{ width: '2px', height: '20px', bottom: '0', left: '0' }}></div>
          </div>
          
          {/* Esquina inferior derecha */}
          <div className="absolute" style={{ bottom: '-1px', right: '-1px' }}>
            <div className="absolute bg-[#E91E63]" style={{ width: '20px', height: '2px', bottom: '0', right: '0' }}></div>
            <div className="absolute bg-[#E91E63]" style={{ width: '2px', height: '20px', bottom: '0', right: '0' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
});

