'use client';

import { memo } from 'react';

interface SimpleLabelProps {
  student: {
    grade: string;
    name: string;
  };
  colorHex: string; // Color de la barra divisoria
  customWidth?: number; // Ancho personalizado opcional (para ajustes de impresión)
}

/**
 * Componente SimpleLabel - Etiqueta simple con curso y nombre
 * Basado en el diseño exacto entregado (curso a la izquierda, franja central de color y nombre a la derecha)
 * Incluye sangrado (bleed) y marco de corte interno con marcas en las esquinas.
 */
export const SimpleLabel = memo(function SimpleLabel({ student, colorHex, customWidth }: SimpleLabelProps) {
  // Sangrado de impresión (bleed) - 5mm ≈ 19px
  const bleed = 19;

  // Dimensiones base de la etiqueta (área de corte final)
  const baseWidth = customWidth || 1000; // Usar ancho personalizado si se proporciona
  const baseHeight = 130;

  const courseText = student.grade || 'Curso';
  const nameText = student.name || 'Nombre del Alumno';

  // Calcular el tamaño de fuente del nombre basado en su longitud
  // Ancho disponible aproximado: baseWidth - sección izquierda (320) - franja (60) - padding (80) ≈ baseWidth - 460
  const nameLength = nameText.length;
  
  // Tamaño de fuente base: 42px
  // Reducir progresivamente según la longitud del nombre
  let nameFontSize = 42;
  
  if (nameLength > 35) {
    // Nombres muy largos (más de 35 caracteres)
    nameFontSize = 26;
  } else if (nameLength > 30) {
    // Nombres largos (30-35 caracteres)
    nameFontSize = 30;
  } else if (nameLength > 25) {
    // Nombres medianos-largos (25-30 caracteres)
    nameFontSize = 34;
  } else if (nameLength > 20) {
    // Nombres medianos (20-25 caracteres)
    nameFontSize = 38;
  }
  // Para nombres de 20 caracteres o menos, usar el tamaño base de 42px

  return (
    <div className="relative" style={{ pageBreakInside: 'avoid' }}>
      {/* Contenedor de la etiqueta COMPLETA con sangrado extendido */}
      <div 
        className="flex w-full h-full overflow-visible relative"
        style={{
          width: `${baseWidth + bleed * 2}px`,
          height: `${baseHeight + bleed * 2}px`,
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          colorAdjust: 'exact',
        }}
      >
        {/* Sección izquierda - Blanca con curso */}
        <div 
          className="bg-white flex items-center justify-center relative"
          style={{
            width: `${320 + bleed}px`,
            height: `${baseHeight + bleed * 2}px`,
            paddingLeft: `${40 + bleed}px`,
            paddingRight: '20px',
            boxSizing: 'border-box',
          }}
        >
          <span className="font-normal text-black" style={{ fontSize: '42px' }}>
            {courseText}
          </span>
        </div>

        {/* Franja central - Color (usa colorHex) */}
        <div 
          className="relative"
          style={{
            backgroundColor: colorHex,
            width: '60px',
            height: `${baseHeight + bleed * 2}px`,
          }}
        />

        {/* Sección derecha - Blanca con nombre */}
        <div 
          className="flex-1 bg-white flex items-center relative"
          style={{
            height: `${baseHeight + bleed * 2}px`,
            paddingLeft: '40px',
            paddingRight: `${40 + bleed}px`,
            boxSizing: 'border-box',
          }}
        >
          <span 
            className="font-bold text-black" 
            style={{ 
              fontSize: `${nameFontSize}px`,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
            }}
          >
            {nameText}
          </span>
        </div>

        {/* Marco de corte DENTRO de la etiqueta */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: `${bleed}px`,
            left: `${bleed}px`,
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            border: '2px solid #E91E63',
            borderRadius: '12px',
            boxSizing: 'border-box',
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
