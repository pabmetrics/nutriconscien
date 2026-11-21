// Servidor mínimo de dist/ por si Hostinger arranca la web como aplicación Node.js (npm start).
// Reproduce lo importante del .htaccess: cabeceras de seguridad, portadas antiguas → /, 404 → portada.
// (HTTPS lo pone el proxy de Hostinger.)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const RAIZ = new URL('../dist/', import.meta.url).pathname;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2' };
const SEGURIDAD = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000' };
const ANTIGUAS = /^\/(index-nuvona|index-v1-backup|index-nutriconscien-backup|landing-v\d+)\.html$/;

createServer(async (req, res) => {
  let ruta;
  try { ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  if (ANTIGUAS.test(ruta)) { res.writeHead(301, { Location: '/', ...SEGURIDAD }); return res.end(); }
  if (/^\/recetas\/?$/.test(ruta)) { res.writeHead(301, { Location: '/recetas.html', ...SEGURIDAD }); return res.end(); }
  if (ruta.endsWith('/')) ruta += 'index.html';
  const fichero = normalize(join(RAIZ, ruta));
  if (!fichero.startsWith(RAIZ) || /\/\./.test(ruta)) { res.writeHead(403, SEGURIDAD); return res.end(); }
  const cabeceras = { ...SEGURIDAD, 'Content-Type': TIPOS[extname(fichero)] || 'application/octet-stream' };
  if (/\/(cuenta|mi-plan)\.html$/.test(ruta)) cabeceras['Cache-Control'] = 'no-store';
  try {
    const datos = await readFile(fichero);
    res.writeHead(200, cabeceras); res.end(datos);
  } catch {
    res.writeHead(404, { ...SEGURIDAD, 'Content-Type': TIPOS['.html'] });
    res.end(await readFile(join(RAIZ, 'index.html')));
  }
}).listen(process.env.PORT || 3000);
