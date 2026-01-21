# Guía de Adaptación: Sistema de Etiquetas PDF

Esta guía documenta cómo está estructurado el sistema de gestión de PDFs de etiquetas escolares para poder adaptarlo al proyecto `intranetAlmonte`.

---

## 📋 Tabla de Contenidos

1. [Estructura General](#estructura-general)
2. [Content Type en Strapi](#content-type-en-strapi)
3. [Tipos TypeScript](#tipos-typescript)
4. [API Route (Backend)](#api-route-backend)
5. [Cliente API (Helpers)](#cliente-api-helpers)
6. [Página del Listado (Frontend)](#página-del-listado-frontend)
7. [Cliente Strapi Base](#cliente-strapi-base)
8. [Pasos de Implementación](#pasos-de-implementación)

---

## 🏗️ Estructura General

```
etiquetas-escolar/
├── app/
│   ├── api/
│   │   └── etiquetas-pdf/
│   │       └── route.ts          # API Route GET /api/etiquetas-pdf
│   └── etiquetas-pdf/
│       └── page.tsx              # Página del listado (Frontend)
├── lib/
│   └── api/
│       ├── etiquetas-pdf.ts      # Funciones helper para consultas
│       └── strapi.ts              # Cliente base de Strapi
└── types/
    └── strapi.ts                  # Tipos TypeScript
```

---

## 📦 Content Type en Strapi

### Nombre del Content Type
- **Singular:** `etiqueta-pdf`
- **Plural:** `etiquetas-pdf`
- **Display Name:** `Etiquetas - PDFs`

### Campos del Schema

| Campo | Tipo | Requerido | Único | Descripción |
|-------|------|-----------|-------|-------------|
| `apoderado` | Relation (Many-to-One) | ✅ | ❌ | Relación con `etiquetas-apoderados` |
| `alumno` | Relation (Many-to-One) | ✅ | ❌ | Relación con `etiquetas-alumnos` |
| `fecha_generacion` | DateTime | ✅ | ❌ | Fecha de generación del PDF |
| `hash_qr` | String (8-16 chars) | ✅ | ✅ | Hash único del QR (8 caracteres) |
| `numero_orden` | Integer | ✅ | ✅ | Número de orden único (formato: YYNNNNNNN) |
| `año_escolar` | Integer | ✅ | ❌ | Año escolar (ej: 2026) |
| `colegio_nombre` | String | ✅ | ❌ | Nombre del colegio |
| `estado` | Enumeration | ❌ | ❌ | Valores: `generado`, `impreso`, `archivado` |
| `archivo_pdf` | Media (Single) | ✅ | ❌ | Archivo PDF subido |

### Permisos de API
- Asegúrate de que el Content Type `etiquetas-pdf` esté habilitado en los permisos de tu API Key
- Permisos necesarios: `find`, `findOne` (al menos para lectura)

---

## 📝 Tipos TypeScript

### Archivo: `types/strapi.ts`

```typescript
// Tipo para Etiquetas - PDF
export interface EtiquetaPDF {
    id: number;
    documentId: string;
    apoderado?: Apoderado | string; // Puede ser objeto o documentId
    alumno?: Alumno | string; // Puede ser objeto o documentId
    fecha_generacion: string; // ISO date string
    hash_qr: string;
    archivo_pdf?: {
        id: number;
        url: string;
        name: string;
        mime: string;
        size: number;
    };
    numero_orden: number; // Integer según tu schema
    año_escolar: number;
    colegio_nombre: string; // Required según tu schema
    estado?: 'generado' | 'impreso' | 'archivado';
}

// Tipos relacionados
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
}

export interface Alumno {
    id: number;
    documentId: string;
    nombres: string;
    primer_apellido: string;
    segundo_apellido?: string;
    curso: string;
    letra: string;
    colegio: string;
    apoderado?: Apoderado | null;
}

// Respuestas de Strapi
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
```

---

## 🔌 API Route (Backend)

### Archivo: `app/api/etiquetas-pdf/route.ts`

**Endpoint:** `GET /api/etiquetas-pdf`

**Query Parameters:**
- `search` (string, opcional): Búsqueda general en múltiples campos
- `año_escolar` (number, opcional): Filtrar por año escolar
- `estado` (string, opcional): Filtrar por estado (`generado`, `impreso`, `archivado`)
- `page` (number, opcional): Número de página (default: 1)
- `pageSize` (number, opcional): Tamaño de página (default: 50)

**Código completo:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { strapi } from '@/lib/api/strapi';
import type { EtiquetaPDF, StrapiCollectionResponse } from '@/types/strapi';
import { logger } from '@/lib/helpers/logger';
import { env } from '@/lib/env';

/**
 * GET /api/etiquetas-pdf
 * Obtiene todos los PDFs con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const añoEscolar = searchParams.get('año_escolar');
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Construir filtros
    const filters: string[] = [];
    
    // Búsqueda general (busca en múltiples campos)
    if (search) {
      const searchEncoded = encodeURIComponent(search);
      // Si es numérico, no aplicar filtro en servidor (se filtrará en cliente para coincidencia parcial)
      if (!/^\d+$/.test(search)) {
        // Buscar en hash_qr, colegio_nombre (solo para búsquedas de texto)
        filters.push(`filters[$or][0][hash_qr][$contains]=${searchEncoded}`);
        filters.push(`filters[$or][1][colegio_nombre][$contains]=${searchEncoded}`);
      }
    }

    // Filtro por año escolar
    if (añoEscolar) {
      filters.push(`filters[año_escolar][$eq]=${añoEscolar}`);
    }

    // Filtro por estado
    if (estado && ['generado', 'impreso', 'archivado'].includes(estado)) {
      filters.push(`filters[estado][$eq]=${estado}`);
    }

    // Construir query string
    const filterQuery = filters.length > 0 ? `&${filters.join('&')}` : '';
    // Si es búsqueda numérica, obtener más registros para filtrar en cliente
    const isNumericSearch = search && /^\d+$/.test(search);
    const effectivePageSize = isNumericSearch ? Math.max(pageSize, 500) : pageSize;
    const paginationQuery = `pagination[page]=${page}&pagination[pageSize]=${effectivePageSize}`;
    
    // Populate específico: solo los campos que necesitamos
    const populateQuery = [
      'populate[apoderado][fields]=nombres,primer_apellido,segundo_apellido',
      'populate[alumno][fields]=nombres,primer_apellido,segundo_apellido',
      'populate[archivo_pdf][fields]=id,url,name,mime,size'
    ].join('&');
    
    const path = `etiquetas-pdf?${paginationQuery}&${populateQuery}${filterQuery}`;

    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(path);

    // Construir URLs completas para los PDFs
    const pdfsWithUrls = (response.data || []).map((pdf) => {
      if (pdf.archivo_pdf?.url) {
        const pdfUrl = pdf.archivo_pdf.url.startsWith('http')
          ? pdf.archivo_pdf.url
          : `${env.STRAPI_URL}${pdf.archivo_pdf.url}`;
        
        return {
          ...pdf,
          archivo_pdf: {
            ...pdf.archivo_pdf,
            fullUrl: pdfUrl,
          },
        };
      }
      return pdf;
    });

    return NextResponse.json({
      data: pdfsWithUrls,
      meta: response.meta,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('Error obteniendo PDFs:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener PDFs',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
```

**Notas importantes:**
- Usa `populate` específico para evitar problemas con relaciones anidadas en Strapi v5
- Las búsquedas numéricas se filtran en el cliente para permitir coincidencias parciales
- Construye URLs completas para los PDFs antes de devolverlos

---

## 🛠️ Cliente API (Helpers)

### Archivo: `lib/api/etiquetas-pdf.ts`

Funciones helper para consultar PDFs desde cualquier parte de la aplicación:

```typescript
import { strapi } from "./strapi";
import type { EtiquetaPDF, StrapiResponse, StrapiCollectionResponse } from "@/types/strapi";
import { logger } from "@/lib/helpers/logger";

/**
 * Busca PDFs por hash QR
 */
export async function findPDFByHash(hash: string): Promise<EtiquetaPDF | null> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[hash_qr][$eq]=${encodeURIComponent(hash)}&populate=*`
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error: unknown) {
    logger.error("Error buscando PDF por hash", {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      tieneHash: !!hash,
    });
    throw error;
  }
}

/**
 * Busca PDFs por apoderado (documentId)
 */
export async function findPDFsByApoderado(apoderadoDocumentId: string): Promise<EtiquetaPDF[]> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[apoderado][documentId][$eq]=${encodeURIComponent(apoderadoDocumentId)}&populate=*`
    );

    return response.data || [];
  } catch (error: unknown) {
    logger.error("Error buscando PDFs por apoderado", {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      tieneDocumentId: !!apoderadoDocumentId,
    });
    throw error;
  }
}

/**
 * Busca PDFs por alumno (documentId)
 */
export async function findPDFsByAlumno(alumnoDocumentId: string): Promise<EtiquetaPDF[]> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[alumno][documentId][$eq]=${encodeURIComponent(alumnoDocumentId)}&populate=*`
    );

    return response.data || [];
  } catch (error: unknown) {
    logger.error("Error buscando PDFs por alumno", {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      tieneDocumentId: !!alumnoDocumentId,
    });
    throw error;
  }
}

/**
 * Busca PDFs por año escolar
 */
export async function findPDFsByAño(añoEscolar: number): Promise<EtiquetaPDF[]> {
  try {
    const response = await strapi.get<StrapiCollectionResponse<EtiquetaPDF>>(
      `etiquetas-pdf?filters[año_escolar][$eq]=${añoEscolar}&populate=*`
    );

    return response.data || [];
  } catch (error: unknown) {
    logger.error("Error buscando PDFs por año:", error);
    throw error;
  }
}

/**
 * Crea un nuevo registro de PDF en Strapi
 * NOTA: Para subir el archivo PDF, necesitas usar FormData desde una API route
 * Esta función solo crea el registro sin el archivo
 */
export async function createPDFRecord(data: {
  apoderado: string; // documentId
  alumno: string; // documentId
  hash_qr: string;
  numero_orden: number;
  año_escolar: number;
  colegio_nombre: string;
  estado?: 'generado' | 'impreso' | 'archivado';
}): Promise<EtiquetaPDF> {
  try {
    const payload = {
      apoderado: data.apoderado,
      alumno: data.alumno,
      hash_qr: data.hash_qr,
      numero_orden: data.numero_orden,
      año_escolar: data.año_escolar,
      colegio_nombre: data.colegio_nombre,
      estado: data.estado || 'generado',
    };

    const response = await strapi.post<StrapiResponse<EtiquetaPDF>>(
      "etiquetas-pdf",
      payload
    );

    if (!response.data || !response.data.documentId) {
      throw new Error("Error: Strapi no devolvió documentId al crear PDF");
    }

    return response.data;
  } catch (error: unknown) {
    logger.error("Error creando registro de PDF", {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      tieneHashQr: !!data.hash_qr,
      tieneDocumentIds: !!(data.apoderado && data.alumno),
    });
    throw error;
  }
}

/**
 * Actualiza el estado de un PDF
 */
export async function updatePDFEstado(documentId: string, estado: 'generado' | 'impreso' | 'archivado'): Promise<EtiquetaPDF> {
  try {
    const response = await strapi.put<StrapiResponse<EtiquetaPDF>>(
      `etiquetas-pdf/${documentId}`,
      {
        estado: estado,
      }
    );

    return response.data;
  } catch (error: unknown) {
    logger.error("Error actualizando estado de PDF", {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      tieneDocumentId: !!documentId,
      nuevoEstado: estado,
    });
    throw error;
  }
}
```

---

## 🎨 Página del Listado (Frontend)

### Archivo: `app/etiquetas-pdf/page.tsx`

**Características principales:**
- ✅ Búsqueda en tiempo real con debounce (500ms)
- ✅ Filtros por año escolar y estado
- ✅ Búsqueda en múltiples campos (número de orden, hash QR, colegio, nombres)
- ✅ Paginación
- ✅ Tabla responsive con todas las columnas relevantes
- ✅ Manejo de estados de carga y errores

**Estructura del componente:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { EtiquetaPDF } from '@/types/strapi';

interface PDFsResponse {
  data: EtiquetaPDF[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export default function EtiquetasPDFPage() {
  const [pdfs, setPdfs] = useState<EtiquetaPDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [añoEscolar, setAñoEscolar] = useState('');
  const [estado, setEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | null>(null);

  // Funciones helper para obtener nombres
  const getApoderadoNombre = (pdf: EtiquetaPDF): string => {
    if (typeof pdf.apoderado === 'object' && pdf.apoderado) {
      return `${pdf.apoderado.nombres} ${pdf.apoderado.primer_apellido} ${pdf.apoderado.segundo_apellido || ''}`.trim();
    }
    return 'N/A';
  };

  const getAlumnoNombre = (pdf: EtiquetaPDF): string => {
    if (typeof pdf.alumno === 'object' && pdf.alumno) {
      return `${pdf.alumno.nombres} ${pdf.alumno.primer_apellido} ${pdf.alumno.segundo_apellido || ''}`.trim();
    }
    return 'N/A';
  };

  // Filtrar PDFs en el cliente (para búsqueda en nombres de apoderado/alumno)
  const filterPDFs = (pdfs: EtiquetaPDF[], search: string): EtiquetaPDF[] => {
    if (!search) return pdfs;
    
    const searchLower = search.toLowerCase();
    return pdfs.filter((pdf) => {
      // Buscar en número de orden
      if (pdf.numero_orden.toString().includes(search)) return true;
      
      // Buscar en hash QR
      if (pdf.hash_qr.toLowerCase().includes(searchLower)) return true;
      
      // Buscar en colegio
      if (pdf.colegio_nombre.toLowerCase().includes(searchLower)) return true;
      
      // Buscar en nombre de apoderado
      const apoderadoNombre = getApoderadoNombre(pdf).toLowerCase();
      if (apoderadoNombre.includes(searchLower)) return true;
      
      // Buscar en nombre de alumno
      const alumnoNombre = getAlumnoNombre(pdf).toLowerCase();
      if (alumnoNombre.includes(searchLower)) return true;
      
      return false;
    });
  };

  // Cargar PDFs
  const loadPDFs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        if (/^\d+$/.test(searchTerm)) {
          // Si es numérico, enviar al servidor para búsqueda parcial en tiempo real
          params.append('search', searchTerm);
        }
      }
      if (añoEscolar) params.append('año_escolar', añoEscolar);
      if (estado) params.append('estado', estado);
      params.append('page', currentPage.toString());
      params.append('pageSize', '100');

      const response = await fetch(`/api/etiquetas-pdf?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('No pudimos cargar los PDFs en este momento');
      }

      const data: PDFsResponse = await response.json();
      let filteredPDFs = data.data || [];
      
      // Filtrar en el cliente
      if (searchTerm) {
        if (/^\d+$/.test(searchTerm)) {
          filteredPDFs = filteredPDFs.filter((pdf) => 
            pdf.numero_orden.toString().includes(searchTerm)
          );
        } else {
          filteredPDFs = filterPDFs(filteredPDFs, searchTerm);
        }
      }
      
      setPdfs(filteredPDFs);
      setPagination(data.meta?.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un problema inesperado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPDFs();
  }, [currentPage, añoEscolar, estado]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadPDFs();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getPDFUrl = (pdf: EtiquetaPDF & { archivo_pdf?: { fullUrl?: string } & EtiquetaPDF['archivo_pdf'] }): string | null => {
    if (pdf.archivo_pdf?.fullUrl) {
      return pdf.archivo_pdf.fullUrl;
    }
    if (pdf.archivo_pdf?.url) {
      if (pdf.archivo_pdf.url.startsWith('http')) {
        return pdf.archivo_pdf.url;
      }
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '';
      return strapiUrl ? `${strapiUrl}${pdf.archivo_pdf.url}` : null;
    }
    return null;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getEstadoBadgeColor = (estado?: string): string => {
    switch (estado) {
      case 'generado':
        return 'bg-blue-100 text-blue-800';
      case 'impreso':
        return 'bg-green-100 text-green-800';
      case 'archivado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de PDFs - Etiquetas Escolares
          </h1>
          <p className="text-gray-600">
            Busca y descarga los PDFs generados para las etiquetas escolares
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); loadPDFs(); }} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda General
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número de orden, hash QR, colegio, apoderado o alumno..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="añoEscolar" className="block text-sm font-medium text-gray-700 mb-2">
                  Año Escolar
                </label>
                <input
                  type="number"
                  id="añoEscolar"
                  value={añoEscolar}
                  onChange={(e) => setAñoEscolar(e.target.value)}
                  placeholder="Ej: 2026"
                  min="2000"
                  max="2100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="generado">Generado</option>
                  <option value="impreso">Impreso</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando PDFs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadPDFs}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : pdfs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No se encontraron PDFs</p>
          </div>
        ) : (
          <>
            {/* Información de resultados */}
            {pagination && (
              <div className="mb-4 text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} resultados
              </div>
            )}

            {/* Tabla de PDFs */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Apoderado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alumno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Colegio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pdfs.map((pdf) => {
                      const pdfUrl = getPDFUrl(pdf);
                      return (
                        <tr key={pdf.documentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pdf.numero_orden}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getApoderadoNombre(pdf)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getAlumnoNombre(pdf)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {pdf.colegio_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pdf.año_escolar}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(pdf.fecha_generacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(pdf.estado)}`}>
                              {pdf.estado || 'generado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {pdfUrl ? (
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Ver PDF
                              </a>
                            ) : (
                              <span className="text-gray-400">No disponible</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {pagination && pagination.pageCount > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.pageCount, p + 1))}
                  disabled={currentPage === pagination.pageCount}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 🔧 Cliente Strapi Base

### Archivo: `lib/api/strapi.ts`

El cliente base de Strapi que se usa en todas las funciones. Asegúrate de tener algo similar:

```typescript
import { env } from '@/lib/env';
import { logger } from '@/lib/helpers/logger';

interface StrapiErrorResponse {
  error?: {
    message?: string;
    details?: any;
  };
  message?: string;
}

class StrapiClient {
  private baseUrl: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = env.STRAPI_URL;
    this.apiToken = env.STRAPI_API_TOKEN;
  }

  private async fetchAPI<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as StrapiErrorResponse;
      logger.error(`[Strapi API] Error response`, {
        status: response.status,
        statusText: response.statusText,
        errorType: `HTTP_${response.status}`,
        path: path.split('?')[0],
        details: errorData.error,
      });
      const errorMessage = errorData.error?.message || errorData.message || response.statusText;
      const errorDetails = errorData.error?.details ? JSON.stringify(errorData.error.details, null, 2) : '';
      throw new Error(`Error Strapi (${response.status}): ${errorMessage}${errorDetails ? `\nDetalles: ${errorDetails}` : ''}`);
    }

    const data = await response.json();
    return data;
  }

  async get<T>(path: string): Promise<T> {
    return this.fetchAPI<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, data: any): Promise<T> {
    return this.fetchAPI<T>(path, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async put<T>(path: string, data: any): Promise<T> {
    return this.fetchAPI<T>(path, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.fetchAPI<T>(path, { method: 'DELETE' });
  }
}

export const strapi = new StrapiClient();
```

**Variables de entorno necesarias:**
```env
STRAPI_URL=https://tu-strapi-url.com
STRAPI_API_TOKEN=tu-api-token
NEXT_PUBLIC_STRAPI_URL=https://tu-strapi-url.com
```

---

## 📋 Pasos de Implementación

### 1. Configurar Content Type en Strapi
- Crear el Content Type `etiquetas-pdf` con todos los campos mencionados
- Configurar relaciones con `apoderado` y `alumno`
- Configurar permisos de API

### 2. Crear Tipos TypeScript
- Copiar los tipos de `types/strapi.ts` al proyecto `intranetAlmonte`
- Ajustar según la estructura de tu proyecto

### 3. Configurar Cliente Strapi
- Asegurarse de tener un cliente base similar a `lib/api/strapi.ts`
- Configurar variables de entorno

### 4. Crear API Route
- Crear `app/api/etiquetas-pdf/route.ts` (o la ruta equivalente en tu proyecto)
- Ajustar el path según tu estructura de carpetas

### 5. Crear Helpers (Opcional)
- Crear `lib/api/etiquetas-pdf.ts` con las funciones helper si las necesitas

### 6. Crear Página del Listado
- Crear la página del listado (puede ser `app/etiquetas-pdf/page.tsx` o la ruta que prefieras)
- Ajustar estilos según tu diseño
- Ajustar componentes según tu estructura (ej: si no tienes `Logo`, removerlo)

### 7. Probar
- Verificar que los PDFs se carguen correctamente
- Probar búsquedas y filtros
- Verificar que los enlaces a PDFs funcionen

---

## 🔍 Notas Importantes

1. **Strapi v5**: Este código está diseñado para Strapi v5. Si usas v4, necesitarás ajustar la estructura de respuestas (v4 usa `attributes`, v5 no).

2. **URLs de PDFs**: Asegúrate de que las URLs de los PDFs sean públicas o que tengas la autenticación correcta configurada.

3. **Búsqueda numérica**: Las búsquedas numéricas se filtran en el cliente para permitir coincidencias parciales, ya que Strapi no soporta `$contains` en campos numéricos.

4. **Populate**: Se usa populate específico en lugar de `populate=*` para evitar problemas con relaciones anidadas en Strapi v5.

5. **Paginación**: El tamaño de página por defecto es 50, pero se aumenta a 500 para búsquedas numéricas para permitir filtrado en cliente.

---

## 📝 Checklist de Adaptación

- [ ] Content Type `etiquetas-pdf` creado en Strapi
- [ ] Campos configurados correctamente
- [ ] Relaciones configuradas (`apoderado`, `alumno`)
- [ ] Permisos de API configurados
- [ ] Tipos TypeScript copiados y ajustados
- [ ] Cliente Strapi base configurado
- [ ] Variables de entorno configuradas
- [ ] API Route creada
- [ ] Helpers creados (si se necesitan)
- [ ] Página del listado creada
- [ ] Estilos ajustados al diseño del proyecto
- [ ] Pruebas realizadas

---

¡Listo! Con esta guía deberías poder adaptar el sistema de PDFs al proyecto `intranetAlmonte` sin problemas. Si tienes dudas sobre alguna parte específica, revisa el código original en `etiquetas-escolar` o pregunta.
