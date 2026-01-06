'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('/logo.png');

  const handleError = () => {
    if (currentSrc === '/logo.png') {
      // Intentar con logo.svg
      setCurrentSrc('/logo.svg');
    } else if (currentSrc === '/logo.svg') {
      // Intentar con logo.webp
      setCurrentSrc('/logo.webp');
    } else {
      // Si ninguna imagen funciona, mostrar versión de texto
      setImageError(true);
    }
  };

  if (imageError) {
    // Fallback: Versión de texto estilizada
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex flex-col items-start">
          <span className="text-4xl font-bold text-primary tracking-tight" style={{ letterSpacing: '-0.5px' }}>
            escolar
          </span>
          <span className="text-2xl text-primary italic">
            Librería
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo: Intenta cargar desde public/logo.png, logo.svg, o logo.webp */}
      <div className="relative h-16 w-auto">
        <Image
          src={currentSrc}
          alt="Librería Escolar"
          width={300}
          height={80}
          priority
          className="object-contain h-full w-auto"
          onError={handleError}
        />
      </div>
    </div>
  );
}

