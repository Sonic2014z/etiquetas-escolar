'use client';

import { useState } from "react";
import { Download, Eye, Edit2 } from 'lucide-react';
import { SimpleLabel } from '@/components/label/SimpleLabel';

// Colores que alternan por fila
const colors = [
  '#9c2986', // purple
  '#164293', // blue
  '#fdc30a', // yellow
  '#eb5836', // orange
];

interface StudentInfo {
  grade: string;
  name: string;
}

export default function PreviewEtiquetasSimplesPage() {
  const [showForm, setShowForm] = useState(true);
  const [studentData, setStudentData] = useState<StudentInfo>({
    grade: '4° Básico C',
    name: 'María José Mardones',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con controles */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vista Previa de Etiquetas Simples</h1>
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
                </div>
              </div>
            </div>
          )}

          {/* Vista previa */}
          <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-white rounded-lg shadow-md p-8 print:p-2 print:shadow-none">
              {/* Grid de etiquetas simples - 3 columnas x 4 filas = 12 etiquetas */}
              <div className="grid grid-cols-3 gap-1 mb-2 print:gap-0.5 print:mb-1.5">
                {Array.from({ length: 12 }).map((_, idx) => {
                  // Colores alternando por fila
                  const rowIndex = Math.floor(idx / 3); // 3 columnas por fila
                  const colorIndex = rowIndex % colors.length;
                  const colorHex = colors[colorIndex];
                  
                  return (
                    <SimpleLabel
                      key={idx}
                      student={studentData}
                      colorHex={colorHex}
                    />
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
