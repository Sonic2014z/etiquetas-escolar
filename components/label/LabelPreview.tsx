'use client';

import { Card } from "@/components/ui/Card";
import { StudentCardPreview } from "./StudentCardPreview";
import { useEffect, useState } from "react";

interface LabelPreviewProps {
    nombreAlumno: string;
    curso: string;
    letra: string;
    colegio: string;
    rutApoderado?: string;
    telefonoApoderado?: string;
    qrUrl?: string;
}

export function LabelPreview({ nombreAlumno, curso, letra, colegio, rutApoderado, telefonoApoderado, qrUrl }: LabelPreviewProps) {
    // Obtener el año actual
    const currentYear = new Date().getFullYear();
    
    // Construir el texto del curso completo
    const gradeText = `${curso}${letra ? ` ${letra}` : ''}`;
    
    // Preparar datos para StudentCardPreview (clon para la vista previa)
    const studentData = {
        name: nombreAlumno || "Nombre del Alumno",
        grade: gradeText || "Curso",
        school: colegio || "Seleccione un colegio",
        year: currentYear.toString(),
        qrUrl: qrUrl,
    };

    // Color por defecto para la vista previa (púrpura)
    const defaultColor = '#9c2986';

    // Estado para detectar el tamaño de pantalla
    const [scale, setScale] = useState(0.40);
    const [minHeight, setMinHeight] = useState(151);

    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            
            if (width <= 375) {
                // Móviles pequeños
                setScale(0.30);
                setMinHeight(113);
            } else if (width <= 480) {
                // Móviles medianos
                setScale(0.34);
                setMinHeight(129);
            } else if (width <= 640) {
                // Móviles grandes
                setScale(0.36);
                setMinHeight(136);
            } else if (width <= 768) {
                // Tablets
                setScale(0.38);
                setMinHeight(144);
            } else {
                // Escritorio
                setScale(0.40);
                setMinHeight(151);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <div className="w-full overflow-hidden">
            <h2 className="text-lg font-semibold text-foreground-secondary mb-4 hidden lg:block">
                Vista Previa
            </h2>

            <div className="rounded-xl border-2 border-accent/50 bg-accent/5 shadow-sm" style={{ padding: '0px' }}>
                {/* Contenedor escalado para la vista previa - responsive y centrado */}
                <div 
                    className="w-full overflow-hidden flex items-center justify-center"
                    style={{
                        lineHeight: 0,
                        minHeight: `${minHeight}px`,
                    }}
                >
                    {/* Escalar el StudentCardPreview para que quepa bien en la vista previa */}
                    {/* Escala responsive: más grande en móviles */}
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            width: '1018px', // Ancho total con bleed (980 + 19*2)
                            height: '378px',  // Alto total con bleed (340 + 19*2)
                            margin: '0 auto',
                            padding: 0,
                            flexShrink: 0,
                        }}
                    >
                        <StudentCardPreview
                            student={studentData}
                            colorHex={defaultColor}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
