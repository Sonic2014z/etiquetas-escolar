import { Card } from "@/components/ui/Card";
import { capitalizeFirstLetter } from "@/lib/helpers/common";
import { Colegio } from "@/types/strapi";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface AlumnoFormProps {
    nombres: string;
    primerApellido: string;
    segundoApellido: string;
    curso: string;
    letra: string;
    colegio: string;
    colegios?: Colegio[];
    loadingColegios?: boolean;

    onNombresChange: (nombres: string) => void;
    onPrimerApellidoChange: (primerApellido: string) => void;
    onSegundoApellidoChange: (segundoApellido: string) => void;
    onCursoChange: (curso: string) => void;
    onLetraChange: (letra: string) => void;
    onColegioChange: (colegio: string) => void;

    errors?: {
        nombres?: string;
        primerApellido?: string;
        segundoApellido?: string;
        curso?: string;
        letra?: string;
        colegio?: string;
    };
}

export function AlumnoForm({ nombres, primerApellido, segundoApellido, curso, letra, colegio, colegios = [], loadingColegios = false, onNombresChange, onPrimerApellidoChange, onSegundoApellidoChange, onCursoChange, onLetraChange, onColegioChange, errors }: AlumnoFormProps) {
    const baseInputClass = "w-full p-2 rounded-md border border-border bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all";

    const colegioOptions = colegios.filter(c => c && c.attributes).map(c => ({
        value: c.id.toString(),
        label: c.attributes.colegio_nombre || `Colegio ${c.id}`
    }));

    return (
        <Card title="Datos del Alumno" variant="default">
            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground-secondary">Nombres *</label>
                    <input 
                        type="text"
                        value={nombres}
                        onChange={(e) => onNombresChange?.(e.target.value)}
                        onBlur={(e) => onNombresChange?.(capitalizeFirstLetter(e.target.value))}
                        placeholder="Ej: Juan Carlos"
                        className={baseInputClass}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground-secondary">Primer Apellido *</label>
                        <input
                            type="text"
                            value={primerApellido}
                            onChange={(e) => onPrimerApellidoChange?.(e.target.value)}
                            onBlur={(e) => onPrimerApellidoChange?.(capitalizeFirstLetter(e.target.value))}
                            placeholder="Ej: Pérez"
                            className={baseInputClass}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground-secondary">Segundo Apellido *</label>
                        <input
                            type="text"
                            value={segundoApellido}
                            onChange={(e) => onSegundoApellidoChange?.(e.target.value)}
                            onBlur={(e) => onSegundoApellidoChange?.(capitalizeFirstLetter(e.target.value))}
                            placeholder="Ej: Gómez"
                            className={baseInputClass}
                        />
                    </div>
                </div>

                {/* Campo Colegio */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground-secondary">Colegio *</label>
                    <SearchableSelect
                        label="Colegio *"
                        placeholder={loadingColegios ? "Cargando datos..." : "Buscar colegio..."}
                        options={colegioOptions}
                        value={colegio}
                        onChange={(val) => onColegioChange(val as string)}
                        error={errors?.colegio}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground-secondary">Curso *</label>
                        <select
                            value={curso}
                            onChange={(e) => onCursoChange(e.target.value)}
                            className={baseInputClass}
                        >
                            <option value="" disabled>Seleccionar</option>
                            <optgroup label="Básica">
                                <option value="1° Básico">1° Básico</option>
                                <option value="2° Básico">2° Básico</option>
                                <option value="3° Básico">3° Básico</option>
                                <option value="4° Básico">4° Básico</option>
                                <option value="5° Básico">5° Básico</option>
                                <option value="6° Básico">6° Básico</option>
                                <option value="7° Básico">7° Básico</option>
                                <option value="8° Básico">8° Básico</option>
                            </optgroup>
                            <optgroup label="Media">
                                <option value="1° Medio">1° Medio</option>
                                <option value="2° Medio">2° Medio</option>
                                <option value="3° Medio">3° Medio</option>
                                <option value="4° Medio">4° Medio</option>
                            </optgroup>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-bold text-foreground-secondary">Letra *</label>
                        <select
                            value={letra}
                            onChange={(e) => onLetraChange(e.target.value)}
                            className={baseInputClass}
                        >
                            <option value="" disabled>Seleccionar</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                            <option value="H">H</option>
                            <option value="I">I</option>
                            <option value="J">J</option>
                            <option value="K">K</option>
                            <option value="L">L</option>
                            <option value="M">M</option>
                            <option value="N">N</option>
                            <option value="O">O</option>
                            <option value="P">P</option>
                            <option value="Q">Q</option>
                            <option value="R">R</option>
                            <option value="S">S</option>
                            <option value="T">T</option>
                            <option value="U">U</option>
                            <option value="V">V</option>
                            <option value="W">W</option>
                            <option value="X">X</option>
                            <option value="Y">Y</option>
                            <option value="Z">Z</option>
                        </select>
                    </div>
                </div>
            </div>
        </Card>
    )
}