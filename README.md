# Librería Escolar - Sistema de Etiquetas Inteligentes

**Versión:** 1.0.0  
**Estado:** En fase de pruebas

Aplicación web progresiva desarrollada en Next.js para la generación y gestión de etiquetas escolares inteligentes con códigos QR. El sistema permite registrar apoderados y alumnos, vinculándolos bidireccionalmente para facilitar la recuperación de útiles escolares perdidos.

## Stack Tecnológico

* **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Tipografía:** `next/font` (Source Sans 3 para textos, Geist para UI)
* **Backend / CMS:** [Strapi v5](https://strapi.io/)
* **Validaciones:** Custom Logic (Regex para emails, validación personalizada para teléfonos y RUTs)
* **QR Codes:** `qrcode`, `qrcode.react`, `react-qr-code`
* **PDF Generation:** HTML/CSS con `@media print` (renderizado web para impresión)

## 🎯 Características Principales

### Registro de Datos
* **Registro múltiple de estudiantes:** Permite agregar múltiples formularios de alumnos en una sola sesión
* **Validación en tiempo real:** Feedback visual inmediato para RUT, email y campos requeridos
* **Validación de email:** Regex para formato básico (usuario@dominio.extension)
* **Validación de teléfono:** Normalización automática para formato chileno (+56 9 XXXX XXXX)
* **Validación de RUT:** Verificación de dígito verificador y formato chileno
* **Modal de confirmación:** Doble verificación antes de registrar datos

### Sistema de Códigos QR
* **URLs intermediarias:** Sistema de hash corto (8 caracteres) para QR codes más limpios y legibles
* **Almacenamiento persistente:** Los códigos QR se almacenan en Strapi para funcionamiento a largo plazo (ej: año escolar completo)
* **Redirección inteligente:** URLs intermediarias redirigen automáticamente a WhatsApp con datos del apoderado
* **Integración con Strapi:** Content type `etiquetas-qr` para almacenar datos de QR codes

### Generación de Etiquetas PDF
* **Vista previa en tiempo real:** Preview de etiquetas antes de generar PDF
* **Generación de PDF:** Sistema de impresión HTML/CSS optimizado para una sola hoja
* **Múltiples etiquetas:** Genera etiquetas para múltiples estudiantes en una sola sesión
* **Diseño optimizado:** Etiquetas QR, etiquetas simples y etiquetas de asignaturas en un solo documento
* **Colores preservados:** Configuración especial para preservar colores en impresión

### Seguridad y Performance
* **Rate Limiting:** Protección contra abuso con límite de 10 requests/minuto por IP
* **Timeouts:** Timeout de 30 segundos para todas las llamadas a Strapi
* **Logging condicional:** Logs solo en entorno de desarrollo (no expone PII en producción)
* **Validación de variables de entorno:** Verificación al inicio de la aplicación

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
    * `/api/registrar`: Endpoint principal que maneja la lógica transaccional de registro con soporte para múltiples estudiantes.
    * `/api/qr-codes`: Endpoint para crear/actualizar códigos QR en Strapi.
    * `/api/colegios`: Endpoint para obtener lista de colegios desde Strapi.
    * `/qr/[id]`: Ruta dinámica para redirección de URLs intermediarias de QR codes.
    * `/etiquetas`: Página de generación e impresión de etiquetas PDF.
    * `/test-connection`: (Desactivado en Producción) Utilidad para verificar conexión con Strapi.
* `/lib/api`: Funciones tipadas para interactuar con Strapi (`apoderados.ts`, `alumnos.ts`, `colegios.ts`, `qr-codes.ts`, `strapi.ts`).
* `/lib/validations`: Funciones de validación personalizadas (`rut.ts`, `email.ts`).
* `/lib/formatters`: Funciones de formateo (`rut.ts`).
* `/lib/helpers`: Utilidades generales (`common.ts`, `qr-hash.ts`, `rate-limit.ts`, `logger.ts`, `uid.ts`).
* `/types`: Definiciones de TypeScript adaptadas a la estructura plana de Strapi v5 (sin `attributes`).
* `/components`: Componentes React reutilizables.
    * `/forms`: Formularios de entrada (`ApoderadoForm.tsx`, `AlumnoForm.tsx`).
    * `/label`: Componentes relacionados con etiquetas (`LabelPreview.tsx`, `LabelPdf.tsx`).
    * `/ui`: Componentes UI base (`Card.tsx`, `Logo.tsx`, `SearchableSelect.tsx`).

## 🔒 Seguridad y Buenas Prácticas

1.  **Logs Limpios:** El sistema está configurado para **no registrar PII** (Información de Identificación Personal) como RUTs, Nombres o Tokens en los logs del servidor. Los logs solo se muestran en entorno de desarrollo.
2.  **Protección de Rutas:** Las rutas de depuración no son accesibles en el entorno de producción (`NODE_ENV=production`).
3.  **Configuración de Imágenes:** `next.config.ts` restringe la carga de imágenes exclusivamente al dominio confiable de la API.
4.  **Cabeceras:** Se ha deshabilitado `X-Powered-By` para mayor seguridad.
5.  **Rate Limiting:** Protección contra abuso con límite de 10 requests/minuto por IP, con bloqueo de 5 minutos si se excede.
6.  **Timeouts:** Todas las llamadas a Strapi tienen un timeout de 30 segundos para evitar esperas indefinidas.
7.  **Validación de Entorno:** Las variables de entorno requeridas se validan al inicio de la aplicación.

## 📋 Validaciones Implementadas

### Validación de Email
* **Formato:** Regex básico para validar estructura `usuario@dominio.extension`
* **Campo opcional:** El email es opcional, pero si se proporciona debe tener formato válido
* **Validación en tiempo real:** Feedback visual inmediato mientras el usuario escribe
* **Validación en servidor:** Doble verificación antes de guardar en Strapi

### Validación de Teléfono
* **Normalización automática:** Convierte números chilenos a formato estándar (+56 9 XXXX XXXX)
* **Soporte para múltiples formatos:** Acepta 8, 9 u 11 dígitos y los normaliza automáticamente
* **Campo requerido:** El teléfono es obligatorio para generar el código QR

### Validación de RUT
* **Dígito verificador:** Verifica que el dígito verificador sea correcto
* **Formato:** Acepta formato con o sin puntos y guión
* **Campo opcional:** El RUT del apoderado es opcional (configurable en Strapi)

## 🚀 Configuración y Uso

### Variables de Entorno Requeridas

```env
NEXT_PUBLIC_STRAPI_URL=https://tu-strapi-url.com
STRAPI_API_TOKEN=tu-token-de-api
NEXT_PUBLIC_APP_URL=https://tu-dominio.com (opcional, para URLs de QR codes)
```

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## 📝 Notas Técnicas

### Sistema de QR Codes
* Los códigos QR utilizan un sistema de hash de 8 caracteres para URLs cortas y limpias
* Los datos se almacenan en Strapi en el content type `etiquetas-qr`
* Las URLs intermediarias redirigen a WhatsApp con los datos del apoderado prellenados

### Generación de PDFs
* El sistema utiliza HTML/CSS con `@media print` para generar PDFs
* Las etiquetas se optimizan para caber en una sola hoja tamaño carta
* Los colores se preservan usando `print-color-adjust: exact`

### Manejo de Errores
* El sistema implementa manejo de errores parciales: si un estudiante falla, los demás se procesan normalmente
* Los errores se reportan de manera detallada al usuario
* Los errores de red tienen mensajes específicos y útiles

### Performance
* Los componentes de etiquetas utilizan `React.memo()` para optimizar renders
* Los colegios se cargan una vez y se cachean
* Las llamadas a Strapi tienen timeouts para evitar bloqueos

## 🔄 Flujo de Registro

1. Usuario completa formulario de apoderado (nombres, apellidos, teléfono, email opcional, RUT opcional)
2. Usuario agrega uno o más formularios de estudiantes (nombres, apellidos, curso, letra, colegio)
3. Sistema valida campos requeridos y muestra alertas si faltan datos
4. Usuario presiona "Registrar" → aparece modal de confirmación
5. Usuario confirma → sistema envía datos a Strapi
6. Sistema procesa cada estudiante individualmente (manejo de errores parciales)
7. Si el registro es exitoso, se genera automáticamente la página de etiquetas PDF
8. Los códigos QR se almacenan en Strapi para persistencia a largo plazo

## 📚 Dependencias Principales

* `next`: Framework React para producción
* `react`, `react-dom`: Biblioteca UI
* `tailwindcss`: Framework CSS utility-first
* `qrcode`, `qrcode.react`, `react-qr-code`: Generación y renderizado de códigos QR
* `@react-pdf/renderer`: Generación de PDFs (actualmente no utilizado, se usa HTML/CSS print)

## 🐛 Troubleshooting

### Los códigos QR no funcionan
* Verifica que `NEXT_PUBLIC_APP_URL` esté configurado correctamente
* Verifica que el content type `etiquetas-qr` exista en Strapi
* Revisa los logs del servidor para errores de almacenamiento

### Las etiquetas no se imprimen correctamente
* Asegúrate de usar un navegador moderno (Chrome, Firefox, Edge)
* Verifica que la configuración de impresión esté en modo "Más ajustes" → "Gráficos de fondo"
* Las etiquetas están optimizadas para tamaño carta

### Errores de validación
* Verifica que todos los campos requeridos estén completos
* El email debe tener formato válido si se proporciona
* El teléfono se normaliza automáticamente, pero debe tener al menos 8 dígitos

## 📄 Licencia

Este proyecto es privado y de uso interno.