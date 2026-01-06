// Strapi v5: Los datos están directamente en el objeto, sin wrapper "attributes"

export interface Colegio {
    id: number;
    rbd: number;
    colegio_nombre: string;
    dependencia: string;
    comuna: string;
    region: string;
}

// Tipos para Etiquetas - Apoderados
export interface Apoderado {
    id: number;
    documentId: string;
    nombres: string;
    primer_apellido: string;
    segundo_apellido?: string;
    rut: string;
    telefono: string;
    email?: string;
    uid: string;
    alumnos?: Alumno[];
    
}

// Tipos para Etiquetas - Alumnos
export interface Alumno {
    id: number;
    documentId: string;
    nombres: string;
    primer_apellido: string;
    segundo_apellido?: string;
    curso: string;
    letra: string;
    colegio: string; // String, no relación
    apoderado?: Apoderado | null;
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