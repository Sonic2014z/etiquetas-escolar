'use client';

import { memo } from 'react';

interface SubjectLabelProps {
  subject: string;
  colorHex: string; // Color de fondo del header
}

/**
 * Componente SubjectLabel - Etiqueta de asignatura
 * Basado en el diseño exacto de Figma
 */
export const SubjectLabel = memo(function SubjectLabel({ subject, colorHex }: SubjectLabelProps) {
  // Sangrado de impresión (bleed) - 5mm = ~19px
  const bleed = 19;
  
  // Dimensiones base de la etiqueta (área de corte final)
  const baseWidth = 540;
  const baseHeight = 160;

  return (
    <div className="relative">
      {/* Contenedor de la etiqueta COMPLETA con sangrado extendido */}
      <div 
        className="flex flex-col w-full h-full overflow-visible relative"
        style={{
          width: `${baseWidth + bleed * 2}px`,
          height: `${baseHeight + bleed * 2}px`,
        }}
      >
        {/* Sección superior - Color con "ASIGNATURA" y logo "escolar" */}
        <div 
          className="flex items-center justify-between relative"
          style={{
            width: `${baseWidth + bleed * 2}px`,
            height: `${60 + bleed}px`,
            paddingLeft: `${40 + bleed}px`, // Aumentado para centrar más
            paddingRight: `${40 + bleed}px`, // Aumentado para centrar más
            paddingTop: `${bleed}px`,
            backgroundColor: colorHex,
          }}
        >
          <span 
            className="text-white font-semibold tracking-wide"
            style={{
              fontSize: '28px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            ASIGNATURA
          </span>
          
          {/* Logo escolar */}
          <div style={{ width: '110px', height: '28px' }}>
            <img 
              src="/ESCOLAR.png" 
              alt="escolar" 
              style={{
                height: '28px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)', // Convertir a blanco
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
              width="110" 
              height="28" 
              viewBox="0 0 140 40" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'none' }}
            >
              <text 
                x="0" 
                y="30" 
                fill="#ffffff" 
                style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' 
                }}
              >
                <tspan fill="#ffffff">e</tspan>
                <tspan fill="#ffffff">scolar</tspan>
              </text>
              <circle cx="10" cy="15" r="8" fill="#ffffff" opacity="0.3"/>
              <circle cx="18" cy="15" r="8" fill="#ffffff" opacity="0.3"/>
            </svg>
          </div>
        </div>

        {/* Sección inferior - Blanca con nombre de asignatura */}
        <div 
          className="flex-1 bg-white flex items-center justify-center relative"
          style={{
            width: `${baseWidth + bleed * 2}px`,
            paddingLeft: `${40 + bleed}px`, // Aumentado para centrar más
            paddingRight: `${40 + bleed}px`, // Aumentado para centrar más
            paddingBottom: `${bleed}px`,
          }}
        >
          <span 
            className="font-bold text-black"
            style={{
              fontSize: '52px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            {subject || "Asignatura"}
          </span>
        </div>

        {/* Marco de corte DENTRO de la etiqueta */}
        {/* Reducir el ancho del marco para que no llegue a los bordes laterales */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: `${bleed}px`,
            left: `${bleed + 5}px`, // Mover 5px hacia adentro desde el bleed
            width: `${baseWidth - 10}px`, // Reducir 10px (5px por cada lado) para dejar espacio
            height: `${baseHeight}px`,
            border: '2px solid #E91E63',
            borderRadius: '12px',
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
