// Validar variables de entorno solo en runtime, no durante el build
// Esto permite que Next.js haga el build sin requerir las variables
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    (process.env.NODE_ENV === 'production' && !process.env.STRAPI_API_TOKEN);

const requiredEnvVars = {
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
    STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
};

// Solo validar en runtime, no durante el build
if (!isBuildTime) {
    const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    
    if (missingVars.length > 0) {
        throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
    }
}

export const env = {
    STRAPI_URL: requiredEnvVars.NEXT_PUBLIC_STRAPI_URL || '',
    STRAPI_API_TOKEN: requiredEnvVars.STRAPI_API_TOKEN || '',
} as const;
