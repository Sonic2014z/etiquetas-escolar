"use client";

import { useRouter } from "next/navigation";
import type { ParentData, StudentData } from "@/types/label";
import { getWhatsAppNumber } from "@/lib/helpers/common";

interface Props {
    student: StudentData;
    parent: ParentData;
    colegioNombre?: string;
    qrUrl?: string;
}

export default function DownloadPdfButton({ student, parent, colegioNombre, qrUrl }: Props) {
    const router = useRouter();
    const currentYear = new Date().getFullYear();
    
    const handleDownload = () => {
        // Preparar datos para la página de etiquetas
        const studentFullName = `${student.nombres} ${student.primerApellido} ${student.segundoApellido}`;
        const courseText = `${student.course} ${student.letter}`;
        const parentFullName = `${parent.nombres} ${parent.primerApellido}`;
        
        // Dividir el nombre del colegio si es necesario
        const colegioParts = (colegioNombre || student.colegio).split(' ');
        const colegioLine1 = colegioParts.slice(0, Math.ceil(colegioParts.length / 2)).join(' ');
        const colegioLine2 = colegioParts.slice(Math.ceil(colegioParts.length / 2)).join(' ');
        
        // Generar número de orden
        const orderNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        
        // Generar o usar el qrUrl proporcionado
        let finalQrUrl = qrUrl;
        if (!finalQrUrl && parent.phone) {
            const whatsappNumber = getWhatsAppNumber(parent.phone);
            const isPhoneValid = whatsappNumber.length === 11; // 569XXXXXXXX
            
            if (isPhoneValid) {
                const message = `Hola ${parent.nombres}, encontré un útil escolar perteneciente a ${student.nombres} ${student.primerApellido} ${student.segundoApellido} del curso ${student.course} ${student.letter}.`;
                finalQrUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            }
        }
        
        // Construir URL con query params
        const params = new URLSearchParams({
            studentName: studentFullName,
            studentGrade: courseText,
            studentSchool: colegioLine1,
            studentLocation: colegioLine2,
            studentYear: currentYear.toString(),
            orderNumber: orderNumber,
            guardian: parentFullName,
            ...(finalQrUrl && { qrUrl: finalQrUrl }),
        });
        
        // Guardar también en sessionStorage como backup
        const etiquetasData = {
            name: studentFullName,
            grade: courseText,
            school: colegioLine1,
            location: colegioLine2,
            year: currentYear.toString(),
            orderNumber: orderNumber,
            guardian: parentFullName,
            qrUrl: finalQrUrl,
        };
        sessionStorage.setItem('etiquetasData', JSON.stringify(etiquetasData));
        
        // Abrir en nueva ventana para imprimir
        const url = `/etiquetas?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
        >
            📥 Descargar Etiqueta PDF
        </button>
    );
}