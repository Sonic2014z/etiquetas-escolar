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