# 🏷️ Generador de Etiquetas Escolares

Sistema de recuperación de útiles escolares mediante códigos QR que redirigen a WhatsApp. Permite generar etiquetas personalizadas con información del alumno y contacto del apoderado para facilitar la devolución de objetos perdidos.

## 📋 Descripción

Aplicación web desarrollada con Next.js que permite a los colegios generar etiquetas personalizadas para útiles escolares. Cada etiqueta incluye un código QR que, al ser escaneado, abre una conversación de WhatsApp con un mensaje predefinido, facilitando la comunicación entre quien encuentra el objeto y el apoderado del alumno.

## 🚀 Tecnologías Utilizadas

- **[Next.js 16.1.1](https://nextjs.org/)** - Framework React con App Router
- **[React 19.2.3](https://react.dev/)** - Biblioteca UI
- **[TypeScript 5](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework de estilos utility-first
- **[React Compiler](https://react.dev/learn/react-compiler)** - Optimizaciones automáticas de React
- **[react-qr-code](https://www.npmjs.com/package/react-qr-code)** - Generación de códigos QR

## ✨ Funcionalidades Implementadas

### ✅ Sistema de Diseño White Label
- Sistema de variables CSS semánticas para fácil personalización de colores
- Soporte para modo claro/oscuro automático
- Componentes reutilizables con variantes (`Card`, `Button`, etc.)
- Configuración de tema centralizada en `config/theme.ts`

### ✅ Validación y Formateo de RUT Chileno
- Validación completa del dígito verificador (módulo 11)
- Formateo automático mientras el usuario escribe (12.345.678-9)
- Funciones de limpieza y extracción de componentes del RUT
- Feedback visual en tiempo real (válido/inválido)

### ✅ Formateo de Teléfonos Chilenos
- Formateo automático a formato internacional (+56 9 XXXX XXXX)
- Validación de formato
- Generación de enlaces de WhatsApp con mensaje predefinido

### ✅ Componentes de Formulario
- **ApoderadoForm**: Formulario completo para datos del apoderado
  - Nombres y apellidos
  - RUT con validación en tiempo real
  - Teléfono con formateo automático
- **AlumnoForm**: Formulario para datos del estudiante
  - Nombre completo
  - Curso y letra
  - Validaciones de campos requeridos

### ✅ Vista Previa de Etiqueta
- Generación de código QR dinámico
- Visualización en tiempo real de la etiqueta
- Diseño optimizado para impresión
- Información del alumno, curso y contacto del apoderado

### ✅ Generación de QR para WhatsApp
- Construcción automática de URL de WhatsApp
- Mensaje personalizado con información del alumno
- Validación de teléfono antes de generar QR

## 📁 Estructura del Proyecto

```
etiquetas-escolar/
├── app/                    # App Router de Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal (generador)
│   └── globals.css        # Variables CSS y estilos globales
├── components/            # Componentes React
│   ├── ui/                # Componentes base
│   │   └── Card.tsx       # Componente tarjeta reutilizable
│   ├── forms/             # Formularios
│   │   ├── ApoderadoForm.tsx
│   │   └── AlumnoForm.tsx
│   └── label/             # Componentes de etiqueta
│       └── LabelPreview.tsx
├── lib/                   # Funciones y utilidades
│   ├── validations/       # Funciones de validación
│   │   └── rut.ts         # Validación de RUT chileno
│   ├── formatters/        # Funciones de formateo
│   │   └── rut.ts         # Formateo de RUT
│   └── helpers/           # Utilidades generales
│       └── common.ts      # Funciones auxiliares
├── config/                # Configuración
│   └── theme.ts           # Configuración de tema y colores
├── types/                 # Tipos TypeScript
│   └── label.ts           # Tipos para datos de etiquetas
└── public/                # Archivos estáticos
```

## 🛠️ Instalación y Uso

### Prerrequisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd etiquetas-escolar

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build para Producción

```bash
# Compilar la aplicación
npm run build

# Iniciar servidor de producción
npm start
```

## 🎨 Personalización del Tema

El proyecto utiliza un sistema de diseño white label que permite cambiar fácilmente la paleta de colores:

1. **Variables CSS**: Edita `app/globals.css` para cambiar los colores base
2. **Configuración TypeScript**: Actualiza `config/theme.ts` para sincronizar valores
3. **Modo Oscuro**: Se adapta automáticamente según las preferencias del sistema

### Colores Principales

- `--color-primary`: Color principal de la marca
- `--color-secondary`: Color secundario
- `--color-accent`: Color de acento (usado en etiquetas)
- `--color-success`, `--color-error`, `--color-warning`, `--color-info`: Estados

## 📝 Implementaciones Pendientes

### 🔄 Integración con Strapi CMS

#### 1. Creación de Content Types en Strapi

Se requiere crear los siguientes content types en Strapi:

**Colegio (School)**
- `nombre` (Text, required)
- `direccion` (Text)
- `telefono` (Text)
- `email` (Email)
- `logo` (Media, single)

**Curso (Course)**
- `nombre` (Text, required) - Ej: "1° Básico", "2° Básico"
- `letras` (JSON) - Array de letras disponibles: ["A", "B", "C"]
- `colegio` (Relation, many-to-one con Colegio)

**Apoderado (Parent)**
- `nombres` (Text, required)
- `primerApellido` (Text, required)
- `segundoApellido` (Text)
- `rut` (Text, required, unique)
- `telefono` (Text, required)
- `email` (Email)

**Alumno (Student)**
- `nombres` (Text, required)
- `primerApellido` (Text, required)
- `segundoApellido` (Text)
- `curso` (Relation, many-to-one con Curso)
- `letra` (Text, required) - Debe validarse contra las letras del curso
- `apoderado` (Relation, many-to-one con Apoderado)
- `colegio` (Relation, many-to-one con Colegio)

**Etiqueta (Label)**
- `alumno` (Relation, many-to-one con Alumno)
- `qrUrl` (Text) - URL generada del QR
- `fechaCreacion` (DateTime, auto)
- `fechaImpresion` (DateTime, nullable)
- `estado` (Enum: "generada", "impresa", "usada")

#### 2. Configuración de API en Strapi

1. Habilitar permisos públicos para lectura de:
   - `/api/colegios`
   - `/api/cursos`
   - `/api/apoderados`
   - `/api/alumnos`

2. Configurar permisos autenticados para escritura (si es necesario)

3. Configurar CORS para permitir requests desde el frontend

#### 3. Conexión con la Aplicación Next.js

**Instalación de dependencias:**
```bash
npm install @strapi/strapi axios
# o
npm install strapi-sdk-js
```

**Estructura sugerida:**
```
lib/
└── api/
    ├── strapi.ts          # Cliente de Strapi
    ├── colegios.ts        # Endpoints de colegios
    ├── cursos.ts          # Endpoints de cursos
    ├── apoderados.ts      # Endpoints de apoderados
    ├── alumnos.ts        # Endpoints de alumnos
    └── etiquetas.ts       # Endpoints de etiquetas
```

**Variables de entorno necesarias:**
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token
```

**Funcionalidades a implementar:**
- Fetch de colegios disponibles
- Fetch de cursos según colegio seleccionado
- Fetch de letras disponibles según curso
- Búsqueda de apoderados por RUT
- Creación/actualización de apoderados
- Creación/actualización de alumnos
- Guardado de etiquetas generadas
- Historial de etiquetas por alumno

#### 4. Flujo de Integración Propuesto

1. **Selección de Colegio**: Dropdown con colegios desde Strapi
2. **Carga de Cursos**: Al seleccionar colegio, cargar cursos disponibles
3. **Carga de Letras**: Al seleccionar curso, cargar letras disponibles
4. **Búsqueda de Apoderado**: Al ingresar RUT, buscar si existe en Strapi
   - Si existe: Pre-llenar formulario
   - Si no existe: Permitir creación
5. **Guardado de Datos**: Al generar etiqueta, guardar en Strapi
   - Crear/actualizar Apoderado
   - Crear/actualizar Alumno
   - Crear registro de Etiqueta

#### 5. Validaciones Adicionales

- Validar que la letra seleccionada exista en el curso
- Validar RUT único para apoderados
- Validar que el apoderado no tenga más de X alumnos (si aplica)
- Validar límite de etiquetas por alumno

## 🔐 Variables de Entorno

Crear archivo `.env.local`:

```env
# Strapi (cuando se implemente)
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token

# Otros (si es necesario)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta el linter

## 🤝 Contribución

Este es un proyecto privado. Para contribuciones, contactar al equipo de desarrollo.

## 📄 Licencia

Privado - Todos los derechos reservados

## 📞 Soporte

Para consultas o problemas, contactar al equipo de desarrollo.

---

**Versión**: 0.1.0  
**Última actualización**: 2024
