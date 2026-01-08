import { Card } from "@/components/ui/Card";
import { capitalizeFirstLetter } from "@/lib/helpers/common";
import { validateEmail } from "@/lib/helpers/common";

interface ApoderadoFormProps {
    rut: string;
    phone: string;
    nombres?: string;
    primerApellido?: string;
    segundoApellido?: string;
    email?: string;

    onRutChange: (rut: string) => void;
    onPhoneChange: (phone: string) => void;
    onNombresChange?: (nombres: string) => void;
    onPrimerApellidoChange?: (primerApellido: string) => void;
    onSegundoApellidoChange?: (segundoApellido: string) => void;
    onEmailChange?: (email: string) => void;

    isRutValid?: boolean | null;
    isEmailValid?: boolean | null;
    errors?: {
        rut?: string;
        phone?: string;
        nombres?: string;
        primerApellido?: string;
        segundoApellido?: string;
        email?: string;
    };
}

export function ApoderadoForm({ rut, phone, nombres, primerApellido, segundoApellido, email, onRutChange, onPhoneChange, onNombresChange, onPrimerApellidoChange, onSegundoApellidoChange, onEmailChange, isRutValid, errors }: ApoderadoFormProps) {
    const getRutInputClass = () => {
        const base = "w-full p-2 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary";

        if (isRutValid === true) return `${base} border-success focus:ring-success text-success-700 bg-success-50`;
        if (isRutValid === false) return `${base} border-error focus:ring-error text-error-700 bg-error-50`;
        return `${base} border-border bg-background-secondary text-foreground focus:ring-primary`;
    };

    const baseInputClass = "w-full p-2 rounded-md border border-border bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all";

    return (
        <Card title="Datos del Apoderado" variant="default">
            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground-secondary">Nombres <strong className="text-error">*</strong></label>
                    <input
                        type="text"
                        value={nombres}
                        onChange={(e) => onNombresChange?.(e.target.value)}
                        onBlur={(e) => onNombresChange?.(capitalizeFirstLetter(e.target.value))}
                        placeholder="Ej: Juan Carlos"
                        className={baseInputClass}
                    />
                    {errors?.nombres && <p className="text-xs text-error mt-1 animate-pulse">{errors.nombres}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground-secondary">Primer Apellido <strong className="text-error">*</strong></label>
                        <input
                            type="text"
                            value={primerApellido}
                            onChange={(e) => onPrimerApellidoChange?.(e.target.value)}
                            onBlur={(e) => onPrimerApellidoChange?.(capitalizeFirstLetter(e.target.value))}
                            placeholder="Ej: Pérez"
                            className={baseInputClass}
                        />
                        {errors?.primerApellido && <p className="text-xs text-error mt-1 animate-pulse">{errors.primerApellido}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground-secondary">Segundo Apellido</label>
                        <input
                            type="text"
                            value={segundoApellido}
                            onChange={(e) => onSegundoApellidoChange?.(e.target.value)}
                            onBlur={(e) =>  onSegundoApellidoChange?.(capitalizeFirstLetter(e.target.value))}
                            placeholder="Ej: Gómez"
                            className={baseInputClass}
                        />
                        {errors?.segundoApellido && <p className="text-xs text-error mt-1 animate-pulse">{errors.segundoApellido}</p>}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-foreground-secondary">RUT Apoderado</label>
                        {isRutValid === true && <span className="text-xs font-bold text-success">Válido</span>}
                        {isRutValid === false && <span className="text-xs font-bold text-error">Inválido</span>}
                    </div>
                    <input
                        type="text"
                        value={rut}
                        onChange={(e) => onRutChange(e.target.value)}
                        maxLength={12}
                        placeholder="Ej: 12.345.678-K"
                        className={`w-full p-2 rounded-md border transition-all focus:outline-none focus:ring-2 ${getRutInputClass()}`}
                    />
                    {errors?.rut && <p className="text-xs text-error mt-1 animate-pulse">{errors.rut}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground-secondary">Correo Electrónico Apoderado <strong className="text-error">*</strong></label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => onEmailChange?.(e.target.value)}
                        placeholder="Ej: juan.perez@gmail.com"
                        className={baseInputClass}
                    />
                    {errors?.email && <p className="text-xs text-error mt-1 animate-pulse">{errors.email}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground-secondary">Teléfono Apoderado <strong className="text-error">*</strong></label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        maxLength={15}
                        placeholder="Ej: +56 9 8765 4321"
                        className={baseInputClass}
                    />
                    {errors?.phone && <p className="text-xs text-error mt-1 animate-pulse">{errors.phone}</p>}
                    {!errors?.phone && <p className="text-xs text-foreground-muted">Se agregará +56 9 automáticamente.</p>}
                </div>

            </div>
        </Card>
    )
}