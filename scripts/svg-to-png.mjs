/**
 * Genera PNGs a partir de los SVG usados en el correo (lib/api/email-templates.ts).
 * Ejecutar: node scripts/svg-to-png.mjs
 * Los PNG se guardan en public/ y se referencian en el correo con APP_BASE_URL/nombre.png
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Mismos SVG que en lib/api/email-templates.ts (iconos del correo)
const ICONS = [
  {
    name: 'lightbulb',
    size: 24,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#164296" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>',
  },
  {
    name: 'file-pdf',
    size: 20,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="white" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm0 2l5 5h-5V4zm-4 9h2v4h-2v-4zm0-3h2v2h-2v-2zm4 3h2v4h-2v-4zm0-3h2v2h-2v-2z"/></svg>',
  },
  {
    name: 'download',
    size: 18,
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#99A1AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  },
  {
    name: 'map-pin',
    size: 12,
    svg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="#164296" stroke="#164296" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  },
  {
    name: 'calendar',
    size: 12,
    svg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="#164296" stroke="#164296" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  },
];

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  for (const { name, size, svg } of ICONS) {
    const outPath = path.join(PUBLIC_DIR, `${name}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generado: public/${name}.png (${size}x${size})`);
  }

  console.log('Listo. Iconos en public/ para usar en el correo con APP_BASE_URL/nombre.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
