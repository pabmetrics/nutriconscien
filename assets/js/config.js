// Configuración común de la web de Nuvida. Se carga antes que el resto de scripts en todas las páginas.
// Si la API cambia de servidor, se cambia aquí y en ningún otro sitio.
window.NUVIDA = {
  // Dirección de la API: producción (mini PC, Tailscale Funnel) en nuvida.es; demo del mini PC en el resto.
  api: /(^|\.)nuvida\.es$/.test(location.hostname) ? 'https://minipc.tailf50228.ts.net'
    : ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8000'
    : `${location.protocol}//${location.hostname}:8503`,
  // Interruptores: se encienden cuando estén aprobados los textos legales (datos de salud).
  registroAbierto: false,   // muestra «Mi cuenta» en el menú y deja crear cuentas (la API también tiene su interruptor)
  listaEsperaEnApi: false,  // la lista de espera se guarda en la API en vez de enviarse por EmailJS
};
