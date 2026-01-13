'use client';

import { useState, useEffect } from 'react';
import type { EtiquetaPDF } from '@/types/strapi';
import { Logo } from '@/components/ui/Logo';

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
      // Solo enviar búsqueda si es numérica (para número de orden)
      // o si no hay búsqueda, para obtener todos y filtrar en cliente
      if (searchTerm && /^\d+$/.test(searchTerm)) {
        params.append('search', searchTerm);
      }
      if (añoEscolar) params.append('año_escolar', añoEscolar);
      if (estado) params.append('estado', estado);
      params.append('page', currentPage.toString());
      params.append('pageSize', '100'); // Aumentar para permitir filtrado en cliente

      const response = await fetch(`/api/etiquetas-pdf?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar PDFs');
      }

      const data: PDFsResponse = await response.json();
      let filteredPDFs = data.data || [];
      
      // Filtrar en el cliente si hay búsqueda de texto
      if (searchTerm && !/^\d+$/.test(searchTerm)) {
        filteredPDFs = filterPDFs(filteredPDFs, searchTerm);
      }
      
      setPdfs(filteredPDFs);
      setPagination(data.meta?.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPDFs();
  };

  const getPDFUrl = (pdf: EtiquetaPDF & { archivo_pdf?: { fullUrl?: string } & EtiquetaPDF['archivo_pdf'] }): string | null => {
    // La API ya devuelve la URL completa en fullUrl
    if (pdf.archivo_pdf?.fullUrl) {
      return pdf.archivo_pdf.fullUrl;
    }
    // Fallback a url si fullUrl no está disponible
    if (pdf.archivo_pdf?.url) {
      if (pdf.archivo_pdf.url.startsWith('http')) {
        return pdf.archivo_pdf.url;
      }
      // Si es relativa, intentar construir la URL
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
          <Logo className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de PDFs - Etiquetas Escolares
          </h1>
          <p className="text-gray-600">
            Busca y descarga los PDFs generados para las etiquetas escolares
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Búsqueda general */}
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

            {/* Filtros adicionales */}
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
            <p className="text-red-800">Error: {error}</p>
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
