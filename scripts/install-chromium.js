#!/usr/bin/env node

/**
 * Script para instalar Chromium en Railway/entornos Linux
 * Este script intenta instalar Chromium si no está disponible
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Verificando Chromium...');

// Rutas comunes de Chromium en Linux
const chromiumPaths = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
];

// Verificar si Chromium ya está instalado
let chromiumFound = false;
for (const chromiumPath of chromiumPaths) {
  if (fs.existsSync(chromiumPath)) {
    console.log(`✓ Chromium encontrado en: ${chromiumPath}`);
    chromiumFound = true;
    break;
  }
}

if (!chromiumFound) {
  console.log('Chromium no encontrado. Intentando instalar...');
  
  try {
    // Intentar instalar Chromium usando apt (para Railway/Debian)
    console.log('Instalando Chromium...');
    execSync('apt-get update && apt-get install -y chromium chromium-browser || apt-get install -y chromium-browser', {
      stdio: 'inherit',
      shell: '/bin/bash'
    });
    console.log('✓ Chromium instalado exitosamente');
  } catch (error) {
    console.log('⚠ No se pudo instalar Chromium automáticamente.');
    console.log('⚠ Asegúrate de configurar CHROME_EXECUTABLE_PATH en Railway.');
    console.log('⚠ O usa un buildpack que incluya Chrome (ej: heroku-buildpack-chromium)');
  }
} else {
  console.log('✓ Chromium ya está disponible');
}
