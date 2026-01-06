# Librería Escolar - Sistema de Etiquetas Inteligentes

**Versión:** 1.0.0
**Estado:** En fase de pruebas

Aplicación web progresiva desarrollada en Next.js para la generación y gestión de etiquetas escolares inteligentes con códigos QR. El sistema permite registrar apoderados y alumnos, vinculándolos bidireccionalmente para facilitar la recuperación de útiles escolares perdidos.

## Stack Tecnológico

* **Frontend Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Tipografía:** `next/font` (Source Sans 3 para textos, Geist para UI)
* **Backend / CMS:** [Strapi v5](https://strapi.io/)
* **Validaciones:** Custom Logic & Zod

## 🏗️ Arquitectura y Lógica de Negocio

### Integración con Strapi v5 (Punto Crítico)
Este proyecto está optimizado para **Strapi v5**, lo que implica un cambio importante en el manejo de IDs respecto a versiones anteriores.

* **Lectura (GET):** Se puede buscar por `id` numérico (SQL ID) usando filtros (`filters[id][$eq]=...`), pero la respuesta incluye un `documentId`.
* **Escritura/Actualización (PUT/POST):** Para actualizar relaciones o editar registros, **ES OBLIGATORIO usar el `documentId`** (string alfanumérico), no el ID numérico.
* **Relaciones:** Las relaciones son bidireccionales. El sistema se encarga automáticamente de:
    1.  Crear/Buscar Apoderado.
    2.  Crear/Buscar Alumno.
    3.  Vincular Alumno -> Apoderado (usando `documentId`).
    4.  Vincular Apoderado -> Alumno (usando `documentId`).

### Estructura de Carpetas Clave

* `/app`: Rutas de Next.js (App Router).
    * `/api/registrar`: Endpoint principal que maneja la lógica transaccional de registro.
    * `/test-connection`: (Desactivado en Producción) Utilidad para verificar conexión con Strapi.
* `/lib/api`: Funciones tipadas para interactuar con Strapi (`apoderados.ts`, `alumnos.ts`, `strapi.ts`).
* `/types`: Definiciones de TypeScript adaptadas a la estructura plana de Strapi v5 (sin `attributes`).

## 🔒 Seguridad y Buenas Prácticas

1.  **Logs Limpios:** El sistema está configurado para **no registrar PII** (Información de Identificación Personal) como RUTs, Nombres o Tokens en los logs del servidor.
2.  **Protección de Rutas:** Las rutas de depuración no son accesibles en el entorno de producción (`NODE_ENV=production`).
3.  **Configuración de Imágenes:** `next.config.ts` restringe la carga de imágenes exclusivamente al dominio confiable de la API.
4.  **Cabeceras:** Se ha deshabilitado `X-Powered-By` para mayor seguridad.
