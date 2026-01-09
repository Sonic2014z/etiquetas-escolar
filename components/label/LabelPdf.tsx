"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ParentData, StudentData } from "@/types/label";

// Colores para las franjas verticales (basado en el código proporcionado)
const COLORS = [
  '#9333ea', // purple-600
  '#f97316', // orange-500
  '#facc15', // yellow-400
  '#2563eb', // blue-600
  '#ec4899', // pink-500
  '#ea580c', // orange-600
  '#eab308', // yellow-500
];

// Asignaturas con sus colores (basado en el código proporcionado)
const SUBJECTS_ROW1 = [
  { name: 'Matemática', color: '#1e40af' }, // blue-700
  { name: 'Lenguaje', color: '#db2777' }, // pink-600
  { name: 'Historia', color: '#f97316' }, // orange-500
  { name: 'Ciencias', color: '#facc15' }, // yellow-400
  { name: 'Artes', color: '#1e40af' }, // blue-700
];

const SUBJECTS_ROW2 = [
  { name: 'Matemática', color: '#1e40af' },
  { name: 'Lenguaje', color: '#db2777' },
  { name: 'Historia', color: '#f97316' },
  { name: 'Ciencias', color: '#facc15' },
  { name: 'Música', color: '#1e40af' },
];

const SUBJECTS_ROW3 = [
  { name: 'Biología', color: '#1e40af' },
  { name: 'Física', color: '#db2777' },
];

const SUBJECTS_ROW4 = [
  { name: 'Biología', color: '#1e40af' },
  { name: 'Física', color: '#db2777' },
];

const SUBJECTS_ROW5 = [
  { name: 'Química', color: '#1e40af' },
  { name: 'Química', color: '#db2777' },
];

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 8,
  },
  // Contenedor principal
  container: {
    flexDirection: 'column',
  },
  // Grid para etiquetas principales (3 columnas)
  grid3Cols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  // Grid para etiquetas simples (4 columnas)
  grid4Cols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  // Grid para asignaturas (5 columnas)
  grid5Cols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  // Etiqueta principal con QR
  studentCard: {
    width: '33.33%',
    height: 35,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 4,
    flexDirection: 'row',
  },
  // Sección QR con color
  qrSection: {
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  // QR Code container
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 2,
    borderRadius: 2,
  },
  qrImage: {
    width: 15,
    height: 15,
  },
  // Texto vertical "PORTA ESTO"
  verticalText: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 1,
  },
  verticalTextChar: {
    fontSize: 4,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 1.1,
  },
  // Información del estudiante
  infoSection: {
    flex: 1,
    padding: 3,
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 3,
    fontWeight: 'bold',
    lineHeight: 1.2,
    marginBottom: 1,
  },
  studentGrade: {
    fontSize: 2.5,
    lineHeight: 1.2,
    marginBottom: 2,
  },
  studentSchool: {
    fontSize: 2,
    color: '#4b5563',
    lineHeight: 1.1,
    marginBottom: 1,
  },
  studentLocation: {
    fontSize: 2,
    color: '#4b5563',
    lineHeight: 1.1,
  },
  escolarText: {
    fontSize: 3,
    color: '#1e40af',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 1,
  },
  // Etiqueta simple
  simpleLabel: {
    width: '25%',
    height: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  simpleGrade: {
    marginRight: 4,
  },
  simpleGradeHighlight: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  simpleName: {
    fontWeight: 'bold',
  },
  // Etiqueta de asignatura
  subjectLabel: {
    width: '20%',
    height: 18,
    marginRight: 2,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  subjectName: {
    fontSize: 3.5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  footerSubtitle: {
    fontSize: 3.5,
    color: '#4b5563',
    marginBottom: 6,
  },
  footerOrder: {
    fontSize: 3,
    color: '#374151',
    marginBottom: 1,
  },
  footerGuardian: {
    fontSize: 3,
    color: '#374151',
  },
  footerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  logoEscolar: {
    fontSize: 6,
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  logoLibreria: {
    fontSize: 3.5,
    color: '#4b5563',
    fontStyle: 'italic',
  },
});

interface LabelPdfProps {
  student: StudentData;
  parent: ParentData;
  colegioNombre: string;
  qrCodeDataUrl: string;
}

// Componente para la tarjeta de estudiante con QR
const StudentCard = ({ 
  student, 
  parent, 
  colegioNombre, 
  qrCodeDataUrl, 
  color, 
  currentYear 
}: { 
  student: StudentData; 
  parent: ParentData; 
  colegioNombre: string; 
  qrCodeDataUrl: string; 
  color: string;
  currentYear: number;
}) => {
  const studentFullName = `${student.nombres} ${student.primerApellido} ${student.segundoApellido}`;
  const courseText = `${student.course} ${student.letter}`;
  
  // Dividir el nombre del colegio si es muy largo
  const colegioParts = colegioNombre.split(' ');
  const colegioLine1 = colegioParts.slice(0, Math.ceil(colegioParts.length / 2)).join(' ');
  const colegioLine2 = colegioParts.slice(Math.ceil(colegioParts.length / 2)).join(' ');

  return (
    <View style={styles.studentCard}>
      {/* Sección QR con color de fondo */}
      <View style={[styles.qrSection, { backgroundColor: color }]}>
        {/* QR Code */}
        {qrCodeDataUrl && (
          <View style={styles.qrContainer}>
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
          </View>
        )}
        {/* Texto vertical "DEVOLVER AQUI" */}
        <View style={styles.verticalText}>
          {['D', 'E', 'V', 'O', 'L', 'V', 'E', 'R', ' ', 'A', 'Q', 'U', 'I'].map((char, i) => (
            <Text key={i} style={styles.verticalTextChar}>{char}</Text>
          ))}
        </View>
      </View>

      {/* Información del estudiante */}
      <View style={styles.infoSection}>
        <View>
          <Text style={styles.studentName}>{studentFullName}</Text>
          <Text style={styles.studentGrade}>{courseText}</Text>
        </View>
        <View>
          <Text style={styles.studentSchool}>{colegioLine1}</Text>
          {colegioLine2 && <Text style={styles.studentLocation}>{colegioLine2} {currentYear}</Text>}
        </View>
        <Text style={styles.escolarText}>escolar</Text>
      </View>
    </View>
  );
};

// Componente para etiqueta simple
const SimpleLabel = ({ 
  grade, 
  name, 
  highlight 
}: { 
  grade: string; 
  name: string; 
  highlight: boolean;
}) => {
  return (
    <View style={styles.simpleLabel}>
      <Text style={highlight ? [styles.simpleGrade, styles.simpleGradeHighlight] : styles.simpleGrade}>
        {grade}
      </Text>
      <Text style={styles.simpleName}>{name}</Text>
    </View>
  );
};

// Componente para etiqueta de asignatura
const SubjectLabel = ({ 
  subject, 
  color 
}: { 
  subject: string; 
  color: string;
}) => {
  return (
    <View style={[styles.subjectLabel, { backgroundColor: color }]}>
      <Text style={[styles.subjectName, { color: '#ffffff' }]}>{subject}</Text>
    </View>
  );
};

export const LabelPdf = ({ student, parent, colegioNombre, qrCodeDataUrl }: LabelPdfProps) => {
  const currentYear = new Date().getFullYear();
  const studentFullName = `${student.nombres} ${student.primerApellido} ${student.segundoApellido}`;
  const courseText = `${student.course} ${student.letter}`;
  
  // Generar número de orden aleatorio
  const orderNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.container}>
          {/* Sección 1: 21 etiquetas principales con QR (7 filas x 3 columnas) */}
          <View style={styles.grid3Cols}>
            {Array.from({ length: 21 }).map((_, idx) => {
              const colorIndex = Math.floor(idx / 3) % COLORS.length;
              return (
                <StudentCard
                  key={`card-${idx}`}
                  student={student}
                  parent={parent}
                  colegioNombre={colegioNombre}
                  qrCodeDataUrl={qrCodeDataUrl}
                  color={COLORS[colorIndex]}
                  currentYear={currentYear}
                />
              );
            })}
          </View>

          {/* Sección 2: 16 etiquetas simples (4 filas x 4 columnas) */}
          <View style={styles.grid4Cols}>
            {Array.from({ length: 16 }).map((_, idx) => (
              <SimpleLabel
                key={`simple-${idx}`}
                grade={courseText}
                name={studentFullName}
                highlight={idx % 4 === 2}
              />
            ))}
          </View>

          {/* Sección 3: Etiquetas de asignaturas */}
          <View style={{ marginBottom: 12 }}>
            {/* Fila 1 */}
            <View style={styles.grid5Cols}>
              {SUBJECTS_ROW1.map((subject, idx) => (
                <SubjectLabel key={`subj1-${idx}`} subject={subject.name} color={subject.color} />
              ))}
            </View>

            {/* Fila 2 */}
            <View style={styles.grid5Cols}>
              {SUBJECTS_ROW2.map((subject, idx) => (
                <SubjectLabel key={`subj2-${idx}`} subject={subject.name} color={subject.color} />
              ))}
            </View>

            {/* Fila 3 */}
            <View style={styles.grid5Cols}>
              {SUBJECTS_ROW3.map((subject, idx) => (
                <SubjectLabel key={`subj3-${idx}`} subject={subject.name} color={subject.color} />
              ))}
              {/* Espacios vacíos */}
              <View style={{ width: '20%' }} />
              <View style={{ width: '20%' }} />
              <View style={{ width: '20%' }} />
            </View>

            {/* Fila 4 */}
            <View style={styles.grid5Cols}>
              {SUBJECTS_ROW4.map((subject, idx) => (
                <SubjectLabel key={`subj4-${idx}`} subject={subject.name} color={subject.color} />
              ))}
              {/* Espacios vacíos */}
              <View style={{ width: '20%' }} />
              <View style={{ width: '20%' }} />
              <View style={{ width: '20%' }} />
            </View>

            {/* Fila 5 */}
            <View style={styles.grid5Cols}>
              {SUBJECTS_ROW5.map((subject, idx) => (
                <SubjectLabel key={`subj5-${idx}`} subject={subject.name} color={subject.color} />
              ))}
              {/* Espacios vacíos */}
              <View style={{ width: '20%' }} />
              <View style={{ width: '20%' }} />
              <View style={{ width: '20%' }} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {/* Izquierda */}
            <View style={styles.footerLeft}>
              <Text style={styles.footerTitle}>
                Gracias por confiar{'\n'}en Librería Escolar.
              </Text>
              <Text style={styles.footerSubtitle}>
                Etiquetas con QR: Si se pierde, te avisan.
              </Text>
              <Text style={styles.footerOrder}>Orden n°: {orderNumber}</Text>
              <Text style={styles.footerGuardian}>Apoderado: {parent.nombres} {parent.primerApellido}</Text>
            </View>

            {/* Derecha */}
            <View style={styles.footerRight}>
              <Text style={styles.logoEscolar}>escolar</Text>
              <Text style={styles.logoLibreria}>Librería</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
