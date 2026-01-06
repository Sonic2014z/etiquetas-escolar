import { Card } from "@/components/ui/Card";
import QRCode from "react-qr-code";
import { formatChileanPhone } from "@/lib/helpers/common";


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
    
    // Dividir el nombre del colegio en dos líneas si es muy largo
    const colegioParts = colegio ? colegio.split(' ') : [];
    const colegioLine1 = colegioParts.slice(0, Math.ceil(colegioParts.length / 2)).join(' ');
    const colegioLine2 = colegioParts.slice(Math.ceil(colegioParts.length / 2)).join(' ');

    return (
        <div className="sticky top-6">
            <h2 className="text-lg font-semibold text-foreground-secondary mb-4 hidden lg:block">
                Vista Previa
            </h2>

            <Card variant="accent" className="flex flex-col items-center justify-center p-8 bg-slate-50">

                <div id="etiqueta-qr" className="bg-white w-full max-w-[400px] aspect-[2.5/1] border-2 border-black rounded-lg shadow-xl flex flex-row overflow-hidden relative">
                    {/* Borde izquierdo rosa/fucsia con texto "DEVOLVER AQUI" y QR Code */}
                    <div className="bg-[#ec4899] w-36 flex flex-row items-center justify-between p-3 relative shrink-0 h-full">
                        {/* Texto vertical "DEVOLVER AQUI" a la izquierda */}
                        <div className="shrink-0 flex items-center justify-center">
                            <span 
                                className="text-white font-bold text-[10px] tracking-wider whitespace-nowrap"
                                style={{ 
                                    writingMode: 'vertical-rl',
                                    textOrientation: 'mixed',
                                    transform: 'rotate(180deg)'
                                }}
                            >
                                DEVOLVER AQUI
                            </span>
                        </div>
                        
                        {/* QR Code a la derecha dentro del área rosa - Aumentado para mejor escaneo */}
                        <div className="shrink-0">
                            {qrUrl ? (
                                <div className="border border-white/30 p-1.5 rounded bg-white">
                                    <QRCode 
                                        value={qrUrl}
                                        size={120}
                                        level="H"
                                        fgColor="#000000"
                                        bgColor="#ffffff" 
                                    />
                                </div>
                            ) : (
                                <div className="w-[122px] h-[122px] bg-white/20 border-2 border-dashed border-white/50 rounded flex items-center justify-center text-center p-1">
                                    <span className="text-[8px] text-white font-medium">Faltan datos</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contenido principal - área blanca */}
                    <div className="flex-1 flex flex-col items-start p-4">

                        {/* Información del alumno y colegio */}
                        <div className="flex-1 min-w-0 flex flex-col justify-start w-full h-full">
                            {/* Nombre del alumno - grande y en negrita */}
                            <h3 className="font-bold text-lg leading-tight text-black mb-1">
                                {nombreAlumno || "Nombre del Alumno"}
                            </h3>

                            {/* Curso y letra con subrayado */}
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-sm font-bold text-black underline">
                                    {curso || "Curso"} {letra || "?"}
                                </span>
                            </div>

                            {/* Nombre del colegio en dos líneas con año y ESCOLAR */}
                            <div className="flex flex-col gap-0 mt-auto">
                                <div className="flex items-baseline gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-black leading-tight">
                                            {colegioLine1 || "Nombre del"}
                                        </span>
                                        {colegioLine2 && (
                                            <span className="text-xs text-black leading-tight">
                                                {colegioLine2}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-black ml-auto">
                                        {currentYear}
                                    </span>
                                    <span className="text-xs font-bold text-black uppercase ml-2">
                                        ESCOLAR
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}