'use client';

import { StudentCard } from '@/components/label/StudentCard';

export default function TestEtiquetaPage() {
  // Datos de ejemplo basados en la imagen
  const studentData = {
    name: 'María José Mardones',
    grade: '4° Básico C',
    school: 'Colegio Cardenal Raul Silva Enriquez',
    year: '2026',
    qrUrl: 'https://wa.me/56912345678?text=Hola%20encontré%20un%20útil%20escolar',
  };

  // Colores que alternan por fila
  const colors = [
    '#9c2986', // purple
    '#164293', // blue
    '#fdc30a', // yellow
    '#eb5836', // orange
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Vista Previa - Grid 3 Columnas x 7 Filas (21 Etiquetas)</h1>
        
        {/* Grid de etiquetas - 3 columnas x 7 filas = 21 etiquetas */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 21 }).map((_, idx) => {
              // Colores alternando por fila
              const rowIndex = Math.floor(idx / 3); // 3 columnas por fila
              const colorIndex = rowIndex % colors.length;
              const colorHex = colors[colorIndex];
              
              return (
                <StudentCard
                  key={idx}
                  student={studentData}
                  colorHex={colorHex}
                />
              );
            })}
          </div>
        </div>

        {/* Información de diseño */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Características del diseño:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Grid de 3 columnas x 7 filas = 21 etiquetas</li>
            <li>✓ Colores alternando por fila: púrpura, azul, amarillo, naranja</li>
            <li>✓ Borde rosa alrededor de cada etiqueta</li>
            <li>✓ Sección izquierda azul oscuro (28% del ancho)</li>
            <li>✓ Texto "DEVOLVER AQUI" vertical en blanco</li>
            <li>✓ QR code grande y centrado</li>
            <li>✓ Sección derecha blanca (72% del ancho)</li>
            <li>✓ Fuente Montserrat en todos los textos</li>
            <li>✓ Altura: 115px (aumentada 15%)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
