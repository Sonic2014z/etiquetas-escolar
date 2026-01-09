'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ParentData, StudentData } from "@/types/label";

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

// Colores con valores hexadecimales para impresión
const colors = [
  { class: 'bg-purple-600', hex: '#9333ea' },
  { class: 'bg-orange-500', hex: '#f97316' },
  { class: 'bg-yellow-400', hex: '#facc15' },
  { class: 'bg-blue-600', hex: '#2563eb' },
  { class: 'bg-pink-500', hex: '#ec4899' },
  { class: 'bg-orange-600', hex: '#ea580c' },
  { class: 'bg-yellow-500', hex: '#eab308' }
];

const subjects = [
  { name: 'Matemática', color: 'bg-blue-700', hex: '#1d4ed8' },
  { name: 'Lenguaje', color: 'bg-pink-600', hex: '#db2777' },
  { name: 'Historia', color: 'bg-orange-500', hex: '#f97316' },
  { name: 'Ciencias', color: 'bg-yellow-400', hex: '#facc15' },
  { name: 'Artes', color: 'bg-blue-700', hex: '#1d4ed8' },
];

const subjects2 = [
  { name: 'Matemática', color: 'bg-blue-700', hex: '#1d4ed8' },
  { name: 'Lenguaje', color: 'bg-pink-600', hex: '#db2777' },
  { name: 'Historia', color: 'bg-orange-500', hex: '#f97316' },
  { name: 'Ciencias', color: 'bg-yellow-400', hex: '#facc15' },
  { name: 'Música', color: 'bg-blue-700', hex: '#1d4ed8' },
];

const subjects3 = [
  { name: 'Biología', color: 'bg-blue-700', hex: '#1d4ed8' },
  { name: 'Física', color: 'bg-pink-600', hex: '#db2777' },
];

const subjects4 = [
  { name: 'Biología', color: 'bg-blue-700', hex: '#1d4ed8' },
  { name: 'Física', color: 'bg-pink-600', hex: '#db2777' },
];

const subjects5 = [
  { name: 'Química', color: 'bg-blue-700', hex: '#1d4ed8' },
  { name: 'Química', color: 'bg-pink-600', hex: '#db2777' },
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
      // Intentar obtener de sessionStorage como fallback
      const stored = sessionStorage.getItem('etiquetasData');
      if (stored) {
        try {
          setStudentData(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing stored data:', e);
        }
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      {/* Sheet Container */}
      <div className="bg-white p-8 print:p-0">
        {/* Main ID Cards Grid - 3 columns x 7 rows = 21 cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Array.from({ length: 21 }).map((_, idx) => {
            const colorIndex = Math.floor(idx / 3) % colors.length;
            return (
              <StudentCard
                key={idx}
                student={studentData}
                color={colors[colorIndex].class}
                colorHex={colors[colorIndex].hex}
              />
            );
          })}
        </div>

        {/* Simple Name Labels Grid - 4 columns x 4 rows = 16 labels */}
        <div className="grid grid-cols-4 gap-1 mb-4">
          {Array.from({ length: 16 }).map((_, idx) => (
            <SimpleLabel
              key={idx}
              grade={studentData.grade}
              name={studentData.name}
              highlight={idx % 4 === 2}
            />
          ))}
        </div>

        {/* Subject Labels Section */}
        <div className="space-y-1 mb-6">
          {/* Row 1 */}
          <div className="grid grid-cols-5 gap-1">
            {subjects.map((subject, idx) => (
              <SubjectLabel key={idx} subject={subject.name} color={subject.color} colorHex={subject.hex} />
            ))}
          </div>
          
          {/* Row 2 */}
          <div className="grid grid-cols-5 gap-1">
            {subjects2.map((subject, idx) => (
              <SubjectLabel key={idx} subject={subject.name} color={subject.color} colorHex={subject.hex} />
            ))}
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-5 gap-1">
            {subjects3.map((subject, idx) => (
              <SubjectLabel key={idx} subject={subject.name} color={subject.color} colorHex={subject.hex} />
            ))}
            <div></div>
            <div></div>
            <div></div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-5 gap-1">
            {subjects4.map((subject, idx) => (
              <SubjectLabel key={idx} subject={subject.name} color={subject.color} colorHex={subject.hex} />
            ))}
            <div></div>
            <div></div>
            <div></div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-5 gap-1">
            {subjects5.map((subject, idx) => (
              <SubjectLabel key={idx} subject={subject.name} color={subject.color} colorHex={subject.hex} />
            ))}
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t pt-4 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Gracias por confiar<br />en Librería Escolar.
            </h2>
            <p className="text-sm text-gray-600">
              Etiquetas con QR: Si se pierde, te avisan.
            </p>
            <div className="mt-3 text-xs text-gray-700">
              <p>Orden n°: {studentData.orderNumber}</p>
              <p>Apoderado: {studentData.guardian}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-700 font-bold text-2xl">escolar</div>
            <div className="text-gray-600 text-sm italic">Librería</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentCard({ student, color, colorHex }: { student: StudentInfo; color: string; colorHex: string }) {
  // Generar datos para el QR
  const qrData = student.qrUrl || `${student.name}|${student.grade}|${student.school}|${student.orderNumber}`;
  
  return (
    <div className="border border-gray-300 rounded overflow-hidden bg-white">
      <div className="flex gap-2 p-2">
        {/* QR Code Section */}
        <div 
          className={`${color} p-1 rounded flex-shrink-0 relative`}
          style={{ backgroundColor: colorHex }}
        >
          <div className="bg-white p-1">
            <QRCodeSVG value={qrData} size={60} />
          </div>
          <div className="absolute left-0 top-0 bottom-0 flex items-center">
            <div
              className="text-white text-[6px] font-bold tracking-tight"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                padding: '2px'
              }}
            >
              PORTA ESTO
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
          <div>
            <h3 className="text-[10px] font-bold leading-tight">{student.name}</h3>
            <p className="text-[9px] leading-tight">{student.grade}</p>
          </div>
          <div className="text-[7px] text-gray-600 leading-tight">
            <p>{student.school}</p>
            <p>{student.location} {student.year}</p>
          </div>
          <div className="text-right">
            <span className="text-blue-700 font-bold text-[10px]">escolar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleLabel({ grade, name, highlight }: { grade: string; name: string; highlight: boolean }) {
  return (
    <div className="border border-gray-300 px-2 py-1.5 text-[9px] flex items-center gap-2">
      <span 
        className={highlight ? 'bg-yellow-300 px-1' : ''}
        style={highlight ? { backgroundColor: '#fde047' } : {}}
      >
        {grade}
      </span>
      <span className="font-semibold">{name}</span>
    </div>
  );
}

function SubjectLabel({ subject, color, colorHex }: { subject: string; color: string; colorHex: string }) {
  return (
    <div 
      className={`${color} text-white text-center py-1.5 flex items-center justify-center px-2`}
      style={{ backgroundColor: colorHex }}
    >
      <span className="text-sm font-bold">{subject}</span>
    </div>
  );
}

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
