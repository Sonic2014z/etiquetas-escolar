'use client';

import { useState } from "react";
import { Download, Edit2 } from 'lucide-react';
import { SubjectLabel } from '@/components/label/SubjectLabel';

// Asignaturas con sus colores (paleta actualizada)
const subjectRows = [
  // Fila 1: 5 asignaturas
  [
    { name: 'Matemática', color: '#1e40af' }, // blue-700
    { name: 'Lenguaje', color: '#9333ea' }, // purple-600
    { name: 'Historia', color: '#f97316' }, // orange-500
    { name: 'Ciencias', color: '#facc15' }, // yellow-400
    { name: 'Artes', color: '#1e40af' }, // blue-700
  ],
  // Fila 2: 5 asignaturas
  [
    { name: 'Matemática', color: '#1e40af' },
    { name: 'Lenguaje', color: '#9333ea' },
    { name: 'Historia', color: '#f97316' },
    { name: 'Ciencias', color: '#facc15' },
    { name: 'Música', color: '#1e40af' },
  ],
  // Fila 3: 2 asignaturas
  [
    { name: 'Biología', color: '#1e40af' },
    { name: 'Física', color: '#9333ea' },
  ],
  // Fila 4: 2 asignaturas
  [
    { name: 'Biología', color: '#1e40af' },
    { name: 'Física', color: '#9333ea' },
  ],
  // Fila 5: 2 asignaturas
  [
    { name: 'Química', color: '#1e40af' },
    { name: 'Química', color: '#9333ea' },
  ],
];

export default function PreviewEtiquetasAsignaturasPage() {
  const [showForm, setShowForm] = useState(true);
  const [customSubject, setCustomSubject] = useState('Matemática');
  const [customColor, setCustomColor] = useState('#1e40af');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con controles */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vista Previa de Etiquetas de Asignaturas</h1>
              <p className="text-sm text-gray-600 mt-1">Visualiza cómo se verán las etiquetas de asignaturas en el PDF</p>
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
                  Personalizar Etiqueta
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Asignatura
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Matemática"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color del Header
                    </label>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="#1e40af"
                    />
                  </div>

                  {/* Vista previa de etiqueta personalizada */}
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vista Previa Personalizada:
                    </label>
                    <div className="w-full" style={{ maxWidth: '200px' }}>
                      <SubjectLabel 
                        subject={customSubject}
                        colorHex={customColor}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa del grid completo */}
          <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-white rounded-lg shadow-md p-8 print:p-2 print:shadow-none">
              {/* Grid de etiquetas de asignaturas - 5 columnas */}
              <div className="space-y-1 mb-3 print:space-y-0.5 print:mb-2">
                {subjectRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-5 gap-1 print:gap-0.5">
                    {row.map((subject, idx) => (
                      <SubjectLabel 
                        key={`${rowIndex}-${idx}`} 
                        subject={subject.name} 
                        colorHex={subject.color} 
                      />
                    ))}
                    {/* Agregar espacios vacíos si la fila tiene menos de 5 asignaturas */}
                    {Array.from({ length: 5 - row.length }).map((_, idx) => (
                      <div key={`empty-${rowIndex}-${idx}`} aria-hidden="true" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
