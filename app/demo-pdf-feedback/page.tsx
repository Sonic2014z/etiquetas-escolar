'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, XCircle, FileText, Download } from 'lucide-react';

interface PdfJob {
  id: string;
  studentName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export default function DemoPdfFeedbackPage() {
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [pdfJobs, setPdfJobs] = useState<PdfJob[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simular generación de PDFs
  const simulatePdfGeneration = (demoType: string) => {
    setSelectedDemo(demoType);
    setIsProcessing(true);
    setOverallProgress(0);

    // Crear trabajos de ejemplo
    const jobs: PdfJob[] = [
      { id: '1', studentName: 'Juan Pérez Gómez', status: 'pending', progress: 0 },
      { id: '2', studentName: 'María González López', status: 'pending', progress: 0 },
      { id: '3', studentName: 'Carlos Rodríguez Silva', status: 'pending', progress: 0 },
    ];

    setPdfJobs(jobs);

    // Simular procesamiento secuencial
    let currentJobIndex = 0;
    const processNextJob = () => {
      if (currentJobIndex >= jobs.length) {
        setIsProcessing(false);
        return;
      }

      const jobId = jobs[currentJobIndex].id;
      
      // Cambiar a processing
      setPdfJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'processing', progress: 0 } : job
      ));

      // Simular progreso
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setPdfJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress } : job
        ));

        // Calcular progreso general
        const completedJobs = currentJobIndex;
        const currentJobProgress = progress / 100;
        const overall = ((completedJobs + currentJobProgress) / jobs.length) * 100;
        setOverallProgress(Math.min(overall, 100));

        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Marcar como completado
          setPdfJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, status: 'completed', progress: 100 } : job
          ));

          // Calcular progreso general final
          const finalOverall = ((currentJobIndex + 1) / jobs.length) * 100;
          setOverallProgress(finalOverall);

          // Procesar siguiente trabajo después de un pequeño delay
          currentJobIndex++;
          setTimeout(processNextJob, 500);
        }
      }, 200);
    };

    processNextJob();
  };

  const resetDemo = () => {
    setSelectedDemo(null);
    setPdfJobs([]);
    setOverallProgress(0);
    setIsProcessing(false);
  };

  const getStatusIcon = (status: PdfJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusText = (status: PdfJob['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'processing':
        return 'Generando...';
      case 'error':
        return 'Error';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demo: Feedback de Carga para Generación de PDFs
          </h1>
          <p className="text-gray-600">
            Selecciona una opción para ver cómo se vería el feedback de carga durante la generación de PDFs
          </p>
        </div>

        {/* Opciones de Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <DemoOption
            title="Opción 1: Banner Superior"
            description="Banner fijo en la parte superior con progreso general"
            onClick={() => simulatePdfGeneration('banner')}
            disabled={isProcessing}
          />
          <DemoOption
            title="Opción 2: Modal Centrado"
            description="Modal centrado con lista de trabajos y progreso"
            onClick={() => simulatePdfGeneration('modal')}
            disabled={isProcessing}
          />
          <DemoOption
            title="Opción 3: Lista de Trabajos"
            description="Lista expandible con estado de cada PDF"
            onClick={() => simulatePdfGeneration('list')}
            disabled={isProcessing}
          />
          <DemoOption
            title="Opción 4: Notificaciones Toast"
            description="Notificaciones no intrusivas en la esquina"
            onClick={() => simulatePdfGeneration('toast')}
            disabled={isProcessing}
          />
          <DemoOption
            title="Opción 5: Indicador Inline"
            description="Indicador integrado en el mensaje de éxito"
            onClick={() => simulatePdfGeneration('inline')}
            disabled={isProcessing}
          />
          <DemoOption
            title="Opción 6: Barra de Progreso Compacta"
            description="Barra de progreso minimalista en la parte inferior"
            onClick={() => simulatePdfGeneration('compact')}
            disabled={isProcessing}
          />
        </div>

        {/* Reset Button */}
        {selectedDemo && (
          <div className="mb-6">
            <button
              onClick={resetDemo}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reiniciar Demo
            </button>
          </div>
        )}

        {/* Demo 1: Banner Superior */}
        {selectedDemo === 'banner' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Opción 1: Banner Superior</h2>
            <div className="relative">
              {/* Simulación del banner */}
              <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white shadow-lg z-50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">
                        Generando PDFs... {Math.round(overallProgress)}%
                      </span>
                    </div>
                    <div className="text-sm">
                      {pdfJobs.filter(j => j.status === 'completed').length} de {pdfJobs.length} completados
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-blue-700 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-20 p-4 bg-gray-100 rounded">
                <p className="text-gray-600">
                  Este es el contenido de la página. El banner permanece fijo en la parte superior.
                </p>
                <p className="text-gray-600 mt-2">
                  El usuario puede seguir viendo el contenido mientras se generan los PDFs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo 2: Modal Centrado */}
        {selectedDemo === 'modal' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Opción 2: Modal Centrado</h2>
            <div className="relative">
              {/* Simulación del modal */}
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Generando PDFs</h3>
                      {!isProcessing && (
                        <button
                          onClick={resetDemo}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progreso general</span>
                        <span>{Math.round(overallProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {pdfJobs.map((job) => (
                        <div key={job.id} className="flex items-center gap-3 p-2 rounded bg-gray-50">
                          {getStatusIcon(job.status)}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {job.studentName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getStatusText(job.status)}
                            </div>
                            {job.status === 'processing' && (
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!isProcessing && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Todos los PDFs generados exitosamente</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo 3: Lista de Trabajos */}
        {selectedDemo === 'list' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Opción 3: Lista de Trabajos</h2>
            <div className="border rounded-lg divide-y">
              <div className="p-4 bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      Generando {pdfJobs.length} PDFs
                    </span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {Math.round(overallProgress)}% completado
                  </div>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              
              {pdfJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(job.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{job.studentName}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getStatusText(job.status)}
                        </div>
                      </div>
                    </div>
                    {job.status === 'completed' && (
                      <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                    )}
                  </div>
                  {job.status === 'processing' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo 4: Notificaciones Toast */}
        {selectedDemo === 'toast' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Opción 4: Notificaciones Toast</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Las notificaciones aparecen en la esquina superior derecha sin bloquear el contenido.
              </p>
              
              {/* Simulación de toasts */}
              <div className="fixed top-4 right-4 space-y-2 z-50">
                {pdfJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`bg-white rounded-lg shadow-lg border-l-4 p-4 min-w-[300px] transition-all ${
                      job.status === 'completed' ? 'border-green-500' :
                      job.status === 'processing' ? 'border-blue-500' :
                      'border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(job.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {job.studentName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getStatusText(job.status)}
                        </div>
                        {job.status === 'processing' && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-100 rounded">
                <p className="text-gray-600">
                  El usuario puede seguir interactuando con la página mientras se generan los PDFs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo 5: Indicador Inline */}
        {selectedDemo === 'inline' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Opción 5: Indicador Inline</h2>
            <div className="space-y-4">
              {/* Simulación del mensaje de éxito con indicador */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-green-900 mb-1">
                      ¡Registro realizado exitosamente!
                    </div>
                    <div className="text-sm text-green-700 mb-3">
                      Se le enviará el PDF a su correo electrónico en breve.
                    </div>
                    
                    {isProcessing && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generando PDFs...</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          {pdfJobs.filter(j => j.status === 'completed').length} de {pdfJobs.length} PDFs generados
                        </div>
                      </div>
                    )}

                    {!isProcessing && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Todos los PDFs han sido generados exitosamente</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo 6: Barra de Progreso Compacta */}
        {selectedDemo === 'compact' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Opción 6: Barra de Progreso Compacta</h2>
            <div className="relative">
              {/* Simulación de barra fija en la parte inferior */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-gray-700">
                        Generando PDFs...
                      </span>
                      <span className="text-xs text-gray-500">
                        ({pdfJobs.filter(j => j.status === 'completed').length}/{pdfJobs.length})
                      </span>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                    </div>
                    {!isProcessing && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-20 p-4 bg-gray-100 rounded">
                <p className="text-gray-600">
                  La barra de progreso permanece visible en la parte inferior sin interferir con el contenido.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DemoOption({
  title,
  description,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-4 bg-white rounded-lg shadow border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
