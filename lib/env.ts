const requiredEnvVars = {
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
    STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
};

const missingVars = Object.entries(requiredEnvVars).filter(([_, value]) => !value).map(([key]) => key);

if (missingVars.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
}

export const env = {
    STRAPI_URL: requiredEnvVars.NEXT_PUBLIC_STRAPI_URL,
    STRAPI_API_TOKEN: requiredEnvVars.STRAPI_API_TOKEN,
} as const;
