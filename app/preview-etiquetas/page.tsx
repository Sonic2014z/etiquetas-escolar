'use client';

import { useState } from "react";
import { Download, Eye, Edit2 } from 'lucide-react';
import { StudentCard } from '@/components/label/StudentCard';

// Colores con valores hexadecimales para impresión (paleta actualizada)
// Patrón: morado, azul, amarillo, naranjo
const colors = [
  { class: 'bg-purple-600', hex: '#9E2488' }, // MORADO
  { class: 'bg-blue-600', hex: '#164296' }, // AZUL
  { class: 'bg-yellow-400', hex: '#FFC403' }, // AMARILLO
  { class: 'bg-orange-500', hex: '#EA5936' }, // NARANJO
];

// Configuración consolidada de asignaturas por fila (paleta actualizada)
const subjectRows = [
  // Fila 1: 5 asignaturas
  [
    { name: 'Matemática', color: 'bg-blue-700', hex: '#1e40af' },
    { name: 'Lenguaje', color: 'bg-purple-600', hex: '#9333ea' },
    { name: 'Historia', color: 'bg-orange-500', hex: '#f97316' },
    { name: 'Ciencias', color: 'bg-yellow-400', hex: '#facc15' },
    { name: 'Artes', color: 'bg-blue-700', hex: '#1e40af' },
  ],
  // Fila 2: 5 asignaturas
  [
    { name: 'Matemática', color: 'bg-blue-700', hex: '#1e40af' },
    { name: 'Lenguaje', color: 'bg-purple-600', hex: '#9333ea' },
    { name: 'Historia', color: 'bg-orange-500', hex: '#f97316' },
    { name: 'Ciencias', color: 'bg-yellow-400', hex: '#facc15' },
    { name: 'Música', color: 'bg-blue-700', hex: '#1e40af' },
  ],
  // Fila 3: 2 asignaturas + 3 espacios vacíos
  [
    { name: 'Biología', color: 'bg-blue-700', hex: '#1e40af' },
    { name: 'Física', color: 'bg-purple-600', hex: '#9333ea' },
  ],
  // Fila 4: 2 asignaturas + 3 espacios vacíos
  [
    { name: 'Biología', color: 'bg-blue-700', hex: '#1e40af' },
    { name: 'Física', color: 'bg-purple-600', hex: '#9333ea' },
  ],
  // Fila 5: 2 asignaturas + 3 espacios vacíos
  [
    { name: 'Química', color: 'bg-blue-700', hex: '#1e40af' },
    { name: 'Química', color: 'bg-purple-600', hex: '#9333ea' },
  ],
];

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

export default function PreviewEtiquetasPage() {
  const [showForm, setShowForm] = useState(true);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [studentData, setStudentData] = useState<StudentInfo>({
    name: 'María José Mardones',
    grade: '4° Básico C',
    school: 'Colegio Cardenal Raul Silva Enriquez',
    location: '',
    year: new Date().getFullYear().toString(),
    orderNumber: '76549102',
    guardian: 'Juan Mardones',
    qrUrl: 'https://wa.me/56912345678?text=Hola%20encontré%20un%20útil%20escolar',
  });

  const handleInputChange = (field: keyof StudentInfo, value: string) => {
    setStudentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Generar datos para el QR
  const qrData = studentData.qrUrl || `${studentData.name}|${studentData.grade}|${studentData.school}|${studentData.orderNumber}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con controles */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vista Previa de Etiquetas</h1>
              <p className="text-sm text-gray-600 mt-1">Edita los datos y visualiza cómo se verá el PDF</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {showForm ? 'Ocultar' : 'Mostrar'} Formulario
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Imprimir/Descargar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de edición */}
          {showForm && (
            <div className="lg:col-span-1 print:hidden">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Edit2 className="w-5 h-5" />
                  Editar Datos
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Alumno
                    </label>
                    <input
                      type="text"
                      value={studentData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: María José Mardones"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curso
                    </label>
                    <input
                      type="text"
                      value={studentData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 4° Básico C"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Colegio
                    </label>
                    <input
                      type="text"
                      value={studentData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Colegio Cardenal Raul Silva Enriquez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación (opcional)
                    </label>
                    <input
                      type="text"
                      value={studentData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Rancagua"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <input
                      type="text"
                      value={studentData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Orden
                    </label>
                    <input
                      type="text"
                      value={studentData.orderNumber}
                      onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 76549102"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Apoderado
                    </label>
                    <input
                      type="text"
                      value={studentData.guardian}
                      onChange={(e) => handleInputChange('guardian', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Juan Mardones"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL del QR (opcional)
                    </label>
                    <input
                      type="text"
                      value={studentData.qrUrl || ''}
                      onChange={(e) => handleInputChange('qrUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      placeholder="URL de WhatsApp o texto para QR"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa - Grid de 3 columnas x 4 filas preparado para papel carta */}
          <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div 
              className="bg-white rounded-lg shadow-md print:shadow-none print:rounded-none preview-etiquetas-container"
              style={{
                // Dimensiones de papel carta: 8.5" x 11" = 816px x 1056px a 96 DPI
                width: showForm ? '816px' : '100%',
                maxWidth: '816px',
                minHeight: showForm ? '1056px' : 'auto',
                padding: showForm ? '8mm 10mm' : '1rem',
                paddingTop: showForm ? '8mm' : '1rem',
                paddingBottom: showForm ? '8mm' : '1rem',
                paddingLeft: showForm ? '10mm' : '1rem',
                paddingRight: showForm ? '10mm' : '1rem',
                margin: showForm ? '0 auto' : '0',
                boxSizing: 'border-box',
              }}
            >
              {/* Selector de color para las etiquetas */}
              <div className="mb-4 print:hidden">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de las etiquetas
                </label>
                <div className="flex gap-2">
                  {colors.map((colorData, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(colorData)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedColor?.hex === colorData.hex
                          ? 'border-gray-800 ring-2 ring-gray-300'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: colorData.hex }}
                    >
                      <span className="text-white text-xs font-medium">
                        {idx === 0 ? 'Morado' : idx === 1 ? 'Azul' : idx === 2 ? 'Amarillo' : 'Naranjo'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Grid de 3 columnas x 4 filas = 12 etiquetas - Optimizado para papel carta */}
              <div 
                className="grid grid-cols-3 print:grid-cols-3"
                style={{
                  // Sin espacio entre etiquetas: el borde interno actúa como guía de corte
                  gap: 0,
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  width: '100%',
                  pageBreakInside: 'avoid',
                }}
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  // Dimensiones base de la etiqueta según Figma (definidas en StudentCard)
                  const bleed = 19; // mismo bleed que en StudentCard
                  const labelWidth = 980;
                  const labelHeight = 340;
                  const baseWidth = labelWidth + bleed * 2;   // 1018px
                  const baseHeight = labelHeight + bleed * 2; // 378px

                  // Escala para que quepan holgadamente 3 columnas en 816px de ancho (papel carta)
                  const scale = 0.22;

                  return (
                    <div
                      key={idx}
                      style={{
                        width: baseWidth * scale,
                        height: baseHeight * scale,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: 'top left',
                          width: baseWidth,
                          height: baseHeight,
                        }}
                      >
                        <StudentCard
                          student={{
                            name: studentData.name,
                            grade: studentData.grade,
                            school: studentData.school,
                            year: studentData.year,
                            qrUrl: studentData.qrUrl,
                          }}
                          colorHex={selectedColor?.hex || colors[0].hex}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

