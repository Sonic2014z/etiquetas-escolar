import { strapi } from "@/lib/api/strapi";

// Forzamos que esta página sea dinámica para evitar caché
export const dynamic = "force-dynamic";

export default async function TestConnectionPage() {
  let status = "Pendiente";
  let data = null;
  let errorMsg: string | null = null;
  
  const config = {
    url: process.env.NEXT_PUBLIC_STRAPI_URL,
    hasToken: !!process.env.STRAPI_API_TOKEN,
  };

  try {
    // Intento de conexión
    data = await strapi.get("colegios");
    status = "Conexión Exitosa";
  } catch (error: unknown) {
    status = "Error de Conexión";
    
    // Verificación segura del tipo de error
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === "string") {
      errorMsg = error;
    } else {
      errorMsg = "Ocurrió un error desconocido";
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans text-foreground bg-background">
      <h1 className="text-2xl font-bold mb-4">Estado de Conexión Strapi</h1>
      
      <div className="space-y-4">
        <div className={`p-4 rounded border ${status.includes("Exitosa") ? "bg-green-100 dark:bg-green-900 border-green-400" : "bg-red-100 dark:bg-red-900 border-red-400"}`}>
          <p className="font-bold text-lg">{status}</p>
          {errorMsg && <p className="text-red-700 dark:text-red-300 mt-2">Error: {errorMsg}</p>}
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm font-mono overflow-auto border border-border">
          <p><strong>URL Configurada:</strong> {config.url || "NO DEFINIDA"}</p>
          <p><strong>Token Detectado:</strong> {config.hasToken ? "SÍ" : "NO"}</p>
        </div>
        
      </div>
    </div>
  );
}