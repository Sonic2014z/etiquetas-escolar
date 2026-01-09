"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { ParentData, StudentData } from "@/types/label";
import { getWhatsAppNumber } from "@/lib/helpers/common";
import { LabelPdf } from "./LabelPdf";
import QRCode from "qrcode";

interface Props {
    student: StudentData;
    parent: ParentData;
    colegioNombre?: string;
    qrUrl?: string;
}

export default function DownloadPdfButton({ student, parent, colegioNombre, qrUrl }: Props) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const generateQRCode = async () => {
            setIsGenerating(true);
            try {
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

                if (finalQrUrl) {
                    // Generar QR code como data URL
                    const dataUrl = await QRCode.toDataURL(finalQrUrl, {
                        width: 200,
                        margin: 1,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    setQrCodeDataUrl(dataUrl);
                } else {
                    // Si no hay URL, generar un QR con datos básicos
                    const fallbackData = `${student.nombres} ${student.primerApellido}|${student.course} ${student.letter}|${colegioNombre || student.colegio}`;
                    const dataUrl = await QRCode.toDataURL(fallbackData, {
                        width: 200,
                        margin: 1,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    setQrCodeDataUrl(dataUrl);
                }
            } catch (error) {
                console.error("Error generando QR code:", error);
            } finally {
                setIsGenerating(false);
            }
        };

        generateQRCode();
    }, [student, parent, qrUrl, colegioNombre]);

    const colegioFinal = colegioNombre || student.colegio || "Seleccione un colegio";

    if (isGenerating) {
        return (
            <button
                disabled
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed w-full"
            >
                Generando PDF...
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={
                <LabelPdf
                    student={student}
                    parent={parent}
                    colegioNombre={colegioFinal}
                    qrCodeDataUrl={qrCodeDataUrl}
                />
            }
            fileName={`etiqueta-${student.nombres}-${student.primerApellido}.pdf`}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
        >
            {({ loading }) => (
                loading ? "Generando PDF..." : "📥 Descargar Etiqueta PDF"
            )}
        </PDFDownloadLink>
    );
}