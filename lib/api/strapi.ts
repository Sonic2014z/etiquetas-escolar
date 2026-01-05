/* API de Strapi */

/* Variables de entorno */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export function getStrapiURL(path = ""): string {
    const normalizedPath = path !== "" && !path.startsWith("/") ? `/${path}` : path;
    return `${STRAPI_URL}/api${normalizedPath}`;
}

/* Helpers */

async function fetchAPI<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    customHeaders?: HeadersInit,
): Promise<T> {
    const requestUrl = getStrapiURL(path);

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...customHeaders,
    };

    if (STRAPI_TOKEN) {
        (headers as any)["Authorization"] = `Bearer ${STRAPI_TOKEN}`;
    }
    
    const options: RequestInit = {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
        cache: "no-store",
    };

    try {
        const response = await fetch(requestUrl, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Error Strapi (${response.status}): ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`[Strapi API] Error en ${method} ${path}:`, error);
        throw error;
    }
}

/* CLiente Strapi exportable */

export const strapi = {
    get: <T>(path: string, headers?: HeadersInit) => fetchAPI<T>(path, "GET", undefined, headers),
    post: <T>(path: string, data: any, headers?: HeadersInit) => fetchAPI<T>(path, "POST", { data }, headers),
    put: <T>(path: string, data: any, headers?: HeadersInit) => fetchAPI<T>(path, "PUT", { data }, headers),
}