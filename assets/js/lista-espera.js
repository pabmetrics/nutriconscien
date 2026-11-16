// Lista de espera (modal) + utilidades de formularios, comunes a todas las páginas.
// Requiere el SDK de EmailJS cargado antes que este fichero.

const EMAILJS_PUBLIC_KEY = 'kIDl0p49M_JY1KF63';
const EMAILJS_SERVICE = 'service_zevc9t8';
const EMAILJS_TEMPLATE_LISTA = 'template_ge3yzyd';

// Raíz de la web (sirve igual desde / que desde /blog/).
const RAIZ_WEB = new URL('../../', document.currentScript.src).href;
const URL_PRIVACIDAD = RAIZ_WEB + 'legal.html#privacidad';
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);

function casillaPrivacidad(id) {
  return `
    <label class="form-consent" for="${id}">
      <input type="checkbox" id="${id}" required />
      <span>He leído y acepto la <a href="${URL_PRIVACIDAD}" target="_blank">política de privacidad</a>.</span>
    </label>`;
}

function crearModalListaEspera() {
  if (document.getElementById('modalOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';
  overlay.addEventListener('click', cerrarModal);
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitulo">
      <button class="modal__close" type="button" aria-label="Cerrar" onclick="cerrarListaEspera()">✕</button>
      <h2 class="modal__title" id="modalTitulo">Lista de espera</h2>
      <p class="modal__desc">Abrimos plazas por grupos. Déjanos tu nombre y email y te avisamos cuando se abra el siguiente.</p>
      <form class="modal__form" id="waitlistForm" novalidate>
        <div class="form-group">
          <label for="wNombre">Nombre</label>
          <input type="text" id="wNombre" placeholder="Tu nombre" required />
        </div>
        <div class="form-group">
          <label for="wEmail">Email</label>
          <input type="email" id="wEmail" placeholder="tu@email.com" required />
        </div>
        <div class="form-group">
          <label for="wPlan">¿Qué plan te interesa?</label>
          <select id="wPlan">
            <option value="Aún no lo sé">Aún no lo sé</option>
            <option value="Plan 4 semanas">Plan 4 semanas (24 €, pago único)</option>
            <option value="Coach">Coach (15 €/mes)</option>
            <option value="Coach + Ana">Coach + Ana (32 €/mes)</option>
            <option value="Premium">Premium (69 €/mes)</option>
          </select>
        </div>
        ${casillaPrivacidad('wPrivacidad')}
        <button type="submit" class="btn btn--primary" style="width:100%">Apuntarme</button>
        <p class="modal__feedback" id="modalFeedback" aria-live="polite"></p>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('waitlistForm').addEventListener('submit', enviarListaEspera);
}

function abrirListaEspera(plan) {
  crearModalListaEspera();
  if (typeof plan === 'string') document.getElementById('wPlan').value = plan;
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarListaEspera() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function cerrarModal(e) {
  if (e.target === document.getElementById('modalOverlay')) cerrarListaEspera();
}

document.addEventListener('keydown', e => {
  const overlay = document.getElementById('modalOverlay');
  if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) cerrarListaEspera();
});

function mostrarFeedback(el, texto, ok) {
  el.style.color = ok ? '#085229' : '#c0392b';
  el.textContent = texto;
}

// Con la API de Nuvida publicada (<meta name="nuvida-api" content="https://...">), la lista de espera se guarda
// en su base de datos y Ana la ve en el panel. Sin esa meta (hoy), se sigue enviando por EmailJS.
const CLAVE_PLAN = { 'Plan 4 semanas': 'plan_4_semanas', 'Coach': 'coach', 'Coach + Ana': 'coach_ana', 'Premium': 'premium' };
function enviarAlta(nombre, email, plan) {
  const api = document.querySelector('meta[name="nuvida-api"]')?.content;
  if (!api) return emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE_LISTA, { nombre, email, plan });
  return fetch(`${api}/publico/lista-espera`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, plan: CLAVE_PLAN[plan] || 'indeciso', acepto_privacidad: true }),
  }).then(r => { if (!r.ok) throw new Error(String(r.status)); });
}

function enviarListaEspera(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const feedback = document.getElementById('modalFeedback');
  const nombre = document.getElementById('wNombre').value.trim();
  const email = document.getElementById('wEmail').value.trim();
  const plan = document.getElementById('wPlan').value;

  if (!nombre) return mostrarFeedback(feedback, 'Escribe tu nombre.', false);
  if (!EMAIL_VALIDO.test(email)) return mostrarFeedback(feedback, 'Introduce un email válido.', false);
  if (!document.getElementById('wPrivacidad').checked) {
    return mostrarFeedback(feedback, 'Necesitamos que aceptes la política de privacidad.', false);
  }

  btn.textContent = 'Enviando...';
  btn.disabled = true;
  enviarAlta(nombre, email, plan)
    .then(() => {
      mostrarFeedback(feedback, '✓ ¡Listo! Te avisaremos cuando se abra el siguiente grupo.', true);
      form.reset();
    })
    .catch(() => mostrarFeedback(feedback, 'Algo salió mal. Inténtalo de nuevo en unos minutos.', false))
    .finally(() => {
      btn.textContent = 'Apuntarme';
      btn.disabled = false;
    });
}

