// Copia en dist/ solo lo que se publica: sin README, scripts, portadas antiguas ni nada de git.
// Sin dependencias: Hostinger lo ejecuta con `npm run build` y publica dist/.
import { cpSync, existsSync, readdirSync, rmSync, mkdirSync } from 'node:fs';

const FUERA = /^(index-nuvona|index-v1-backup|index-nutriconscien-backup|landing-v\d+)\.html$/;
const CARPETAS = ['assets', 'blog', 'recetas'];
const SUELTOS = ['.htaccess', 'robots.txt', 'sitemap.xml'];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
const paginas = readdirSync('.').filter(f => f.endsWith('.html') && !FUERA.test(f));
for (const f of [...paginas, ...SUELTOS, ...CARPETAS]) {
  if (existsSync(f)) cpSync(f, `dist/${f}`, { recursive: true });
}
console.log(`dist/: ${paginas.length} páginas + ${CARPETAS.join(', ')}`);
