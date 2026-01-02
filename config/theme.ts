/**
 * Sistema de Tema White Label
 * 
 * Este archivo documenta y organiza los valores de colores
 * definidos en globals.css para facilitar su uso en TypeScript.
 * 
 * Nota: Los valores aquí son solo referencia. Los estilos reales
 * se aplican mediante las variables CSS en globals.css
 */

// ============================================
// TIPOS (Opcional pero recomendado)
// ============================================

type ColorScale = {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500: string;  // Color base
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  950?: string;
};

type StateColors = {
  50?: string;
  100?: string;
  500: string;
  600?: string;
  700?: string;
};

// ============================================
// COLORES DE MARCA
// ============================================

const brandColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // ← Color base
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  } as ColorScale,

  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',  // ← Color base
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  } as ColorScale,

  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // ← Color base
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  } as ColorScale,
};

// ============================================
// COLORES DE ESTADO
// ============================================

const stateColors = {
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  } as StateColors,

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  } as StateColors,

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  } as StateColors,

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  } as StateColors,
};

// ============================================
// COLORES DE UI (Interfaz)
// ============================================

const uiColors = {
  background: {
    base: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  
  foreground: {
    base: '#111827',
    secondary: '#6b7280',
    muted: '#9ca3af',
  },
  
  border: {
    base: '#e5e7eb',
    hover: '#d1d5db',
    // focus usa primary-500, se referencia dinámicamente
  },
  
  card: {
    base: '#ffffff',
    hover: '#f9fafb',
  },
  
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// ============================================
// TEMA PRINCIPAL
// ============================================

export const theme = {
  colors: {
    brand: brandColors,
    state: stateColors,
    ui: uiColors,
  },
} as const;

// ============================================
// EXPORTACIONES ÚTILES
// ============================================

// Colores base (los más usados)
export const colors = {
  primary: brandColors.primary[500],
  secondary: brandColors.secondary[500],
  accent: brandColors.accent[500],
  success: stateColors.success[500],
  warning: stateColors.warning[500],
  error: stateColors.error[500],
  info: stateColors.info[500],
} as const;

// Tipo del tema completo (útil para autocompletado)
export type Theme = typeof theme;

