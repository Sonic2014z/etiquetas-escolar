export interface ColegioAttributes {
   rbd: number;
   colegio_nombre: string;
   dependencia: string;
   comuna: string;
   region: string; 
}

export interface Colegio {
    id: number;
    attributes: ColegioAttributes;
}

// Tipos para Etiquetas - Apoderados
export interface ApoderadoAttributes {
    nombres: string;
    primer_apellido: string;
    segundo_apellido?: string;
    rut: string;
    telefono: string;
    email?: string;
    uid: string;
    alumnos?: {
        data: Alumno[];
    };
}

export interface Apoderado {
    id: number;
    attributes: ApoderadoAttributes;
}

// Tipos para Etiquetas - Alumnos
export interface AlumnoAttributes {
    nombres: string;
    primer_apellido: string;
    segundo_apellido?: string;
    curso: string;
    letra: string;
    colegio: string; // String, no relación
    apoderado?: {
        data: Apoderado | null;
    };
}

export interface Alumno {
    id: number;
    attributes: AlumnoAttributes;
}

// Respuesta genérica de Strapi
export interface StrapiResponse<T> {
    data: T;
    meta?: any;
}

export interface StrapiCollectionResponse<T> {
    data: T[];
    meta?: {
        pagination?: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}