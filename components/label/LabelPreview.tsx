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
    const displayPhone = telefonoApoderado ? formatChileanPhone(telefonoApoderado) : "+56 9 ...";

    return (
        <div className="sticky top-6">
            <h2 className="text-lg font-semibold text-foreground-secondary mb-4 hidden lg:block">
                Vista Previa
            </h2>

            <Card variant="accent" className="flex flex-col items-center justify-center p-8 bg-slate-50">

                <div id="etiqueta-qr" className="bg-white w-full max-w-[350px] aspect-[2/1] border-2 border-black rounded-lg shadow-xl flex flex-row items-center p-4 gap-4 overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>

                    <div className="shrink-0 ml-2">
                        {qrUrl ? (
                            <div className="border border-gray-200 p-1 rounded bg-white">
                                <QRCode 
                                    value={qrUrl}
                                    size={80}
                                    level="M"
                                    fgColor="#000000"
                                    bgColor="#ffffff" 
                                />
                            </div>
                        ) : (
                            <div className="w-[82px] h-[82px] bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-center p-1">
                                <span className="text-[10px] text-gray-400 font-medium">Faltan datos</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <h3 className={`font-bold leading-tight truncate text-black ${nombreAlumno.length > 20 ? 'text-sm' : 'text-lg'}`}>
                            {nombreAlumno || "Nombre del Alumno"}
                        </h3>

                        <div className="flex items-baseline gap-2 mt-1 text-black">
                            <span className="text-sm font-medium">
                                {curso || "Curso"}
                            </span>
                            <span className="text-2xl font-black bg-black text-white px-2 rounded-md leading-none pb-1 pt-0.5">
                                {letra || "?"}
                            </span>
                        </div>

                        <div className="h-px w-full bg-gray-200 my-2"></div>

                        <div className="text-sm text-gray-500 mt-2">
                            {colegio || "Nombre del Colegio"}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}