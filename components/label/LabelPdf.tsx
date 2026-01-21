"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ParentData, StudentData } from "@/types/label";

// Colores para las franjas verticales (paleta actualizada) - Actualizados
// Patrón: púrpura, azul, amarillo, naranjo (alternando por columna)
const COLORS = [
  '#9E2488', // MORADO
  '#164296', // AZUL
  '#FFC403', // AMARILLO
  '#EA5936', // NARANJO
];

// Asignaturas con sus colores (paleta actualizada) - Actualizados
const SUBJECTS_ROW1 = [
  { name: 'Matemática', color: '#164296' }, // AZUL
  { name: 'Lenguaje', color: '#9E2488' }, // MORADO
  { name: 'Historia', color: '#EA5936' }, // NARANJO
  { name: 'Ciencias', color: '#FFC403' }, // AMARILLO
  { name: 'Artes', color: '#164296' }, // AZUL
];

const SUBJECTS_ROW2 = [
  { name: 'Matemática', color: '#164296' }, // AZUL
  { name: 'Lenguaje', color: '#9E2488' }, // MORADO
  { name: 'Historia', color: '#EA5936' }, // NARANJO
  { name: 'Ciencias', color: '#FFC403' }, // AMARILLO
  { name: 'Música', color: '#164296' }, // AZUL
];

const SUBJECTS_ROW3 = [
  { name: 'Biología', color: '#164296' }, // AZUL
  { name: 'Física', color: '#9E2488' }, // MORADO
];

const SUBJECTS_ROW4 = [
  { name: 'Biología', color: '#164296' }, // AZUL
  { name: 'Física', color: '#9E2488' }, // MORADO
];

const SUBJECTS_ROW5 = [
  { name: 'Química', color: '#164296' }, // AZUL
  { name: 'Química', color: '#9E2488' }, // MORADO
];

const SUBJECTS_ROW6 = [
  { name: 'Química', color: '#164296' }, // AZUL
  { name: 'Química', color: '#9E2488' }, // MORADO
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
  // Grid para etiquetas simples (5 columnas - 3 filas x 5 columnas = 15 etiquetas)
  grid5ColsSimple: {
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
  // Sección QR con color (franja vertical)
  qrSection: {
    width: 20,
    padding: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Texto vertical "DEVOLVER AQUI"
  verticalText: {
    position: 'absolute',
    left: 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
  },
  verticalTextChar: {
    fontSize: 3,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 1.1,
  },
  // QR Code container
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 1.5,
    borderRadius: 1,
    marginTop: 8,
  },
  qrImage: {
    width: 18,
    height: 18,
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
  // Etiqueta simple (5 columnas = 20% cada una)
  simpleLabel: {
    width: '20%',
    height: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 3,
    paddingVertical: 2,
    fontSize: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  // Franja vertical de color en etiqueta simple
  simpleColorStrip: {
    width: 2,
    height: '100%',
    marginRight: 2,
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
    height: 16,
    marginRight: 2,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  subjectName: {
    fontSize: 3.5,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
  },
  subjectEscolar: {
    fontSize: 2.5,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 2,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  footerLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    lineHeight: 1.2,
  },
  footerSubtitle: {
    fontSize: 3.5,
    color: '#4b5563',
    marginBottom: 4,
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
    justifyContent: 'flex-end',
  },
  logoEscolar: {
    fontSize: 7,
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  logoLibreria: {
    fontSize: 4,
    color: '#2563eb',
    fontWeight: 'normal',
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
      {/* Franja vertical de color con "DEVOLVER AQUI" y QR */}
      <View style={[styles.qrSection, { backgroundColor: color }]}>
        {/* Texto vertical "DEVOLVER AQUI" - cada letra en una línea */}
        <View style={styles.verticalText}>
          {['D', 'E', 'V', 'O', 'L', 'V', 'E', 'R', ' ', 'A', 'Q', 'U', 'I'].map((char, i) => (
            <Text key={i} style={styles.verticalTextChar}>{char}</Text>
          ))}
        </View>
        {/* QR Code */}
        {qrCodeDataUrl && (
          <View style={styles.qrContainer}>
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
          </View>
        )}
      </View>

      {/* Información del estudiante */}
      <View style={styles.infoSection}>
        <View>
          <Text style={styles.studentName}>{studentFullName}</Text>
          <Text style={styles.studentGrade}>{courseText}</Text>
        </View>
        <View>
          <Text style={styles.studentSchool}>{colegioLine1}</Text>
          {colegioLine2 && <Text style={styles.studentLocation}>{colegioLine2}</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
            <Text style={styles.studentLocation}>{currentYear}</Text>
            <Text style={styles.escolarText}> escolar</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente para etiqueta simple
const SimpleLabel = ({ 
  grade, 
  name, 
  color 
}: { 
  grade: string; 
  name: string; 
  color: string;
}) => {
  return (
    <View style={styles.simpleLabel}>
      {/* Franja vertical de color */}
      <View style={[styles.simpleColorStrip, { backgroundColor: color }]} />
      {/* Contenido */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Text style={styles.simpleGrade}>{grade}</Text>
        <Text style={styles.simpleName}>{name}</Text>
      </View>
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
      <Text style={styles.subjectName}>{subject}</Text>
      <Text style={styles.subjectEscolar}>escolar</Text>
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
              // Colores alternando por columna: púrpura, azul, amarillo
              const columnIndex = idx % 3;
              const color = COLORS[columnIndex];
              return (
                <StudentCard
                  key={`card-${idx}`}
                  student={student}
                  parent={parent}
                  colegioNombre={colegioNombre}
                  qrCodeDataUrl={qrCodeDataUrl}
                  color={color}
                  currentYear={currentYear}
                />
              );
            })}
          </View>

          {/* Sección 2: 15 etiquetas simples (3 filas x 5 columnas) */}
          <View style={styles.grid5ColsSimple}>
            {Array.from({ length: 15 }).map((_, idx) => {
              // Colores alternando por fila: púrpura, azul, amarillo
              const rowIndex = Math.floor(idx / 5);
              const colorIndex = rowIndex % COLORS.length;
              const color = COLORS[colorIndex];
              return (
                <SimpleLabel
                  key={`simple-${idx}`}
                  grade={courseText}
                  name={studentFullName}
                  color={color}
                />
              );
            })}
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
            {/* Fila 6: Química (2 asignaturas) */}
            <View style={styles.grid5Cols}>
              {SUBJECTS_ROW6.map((subject, idx) => (
                <SubjectLabel key={`subj6-${idx}`} subject={subject.name} color={subject.color} />
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
                Gracias por confiar en Librería Escolar.
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
