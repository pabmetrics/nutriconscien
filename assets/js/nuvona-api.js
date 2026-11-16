// Cliente de la API de Nuvona (repo nuvona-app). Común a cuenta.html y mi-plan.html.
//
// Dirección de la API: la de <meta name="nuvona-api" content="https://...">, si la página la tiene.
// Si no: en local, http://localhost:8000; en el mini PC (demo), el mismo host en el puerto 8503.
'use strict';

const NuvonaAPI = (() => {
  const meta = document.querySelector('meta[name="nuvona-api"]');
  const BASE = meta?.content
    || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8000' : `${location.protocol}//${location.hostname}:8503`);

  // La sesión se guarda en localStorage para no tener que entrar cada vez (si el navegador lo permite).
  const almacen = {
    leer(k) { try { return localStorage.getItem(k); } catch { return almacen.mem[k] ?? null; } },
    escribir(k, v) { try { localStorage.setItem(k, v); } catch { almacen.mem[k] = v; } },
    borrar(k) { try { localStorage.removeItem(k); } catch { delete almacen.mem[k]; } },
    mem: {},
  };

  const sesion = {
    get acceso() { return almacen.leer('nuvona_acceso'); },
    get refresco() { return almacen.leer('nuvona_refresco'); },
    get activa() { return Boolean(almacen.leer('nuvona_refresco')); },
    guardar(t) { almacen.escribir('nuvona_acceso', t.acceso); almacen.escribir('nuvona_refresco', t.refresco); },
    cerrar() { almacen.borrar('nuvona_acceso'); almacen.borrar('nuvona_refresco'); },
  };

  function mensajeError(cuerpo) {
    const d = cuerpo?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d.map(e => {
        const campo = e.loc?.[e.loc.length - 1];
        if (campo === 'email') return 'Revisa el email.';
        if (campo === 'password') return 'La contraseña tiene que tener al menos 10 caracteres.';
        return e.msg?.replace(/^Value error, /, '') || 'Dato no válido.';
      }).join(' ');
    }
    return 'Algo ha fallado. Inténtalo de nuevo en un momento.';
  }

  async function renovar() {
    if (!sesion.refresco) return false;
    const r = await fetch(`${BASE}/auth/refrescar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresco: sesion.refresco }),
    }).catch(() => null);
    if (!r?.ok) { sesion.cerrar(); return false; }
    sesion.guardar(await r.json());
    return true;
  }

  // pedir('/yo') · pedir('/yo/perfil', {metodo: 'PUT', datos}) · pedir(ruta, {respuesta: 'blob'})
  async function pedir(ruta, { metodo = 'GET', datos, respuesta = 'json', reintento = true } = {}) {
    const cab = {};
    if (datos !== undefined) cab['Content-Type'] = 'application/json';
    if (sesion.acceso) cab.Authorization = `Bearer ${sesion.acceso}`;
    let r;
    try {
      r = await fetch(`${BASE}${ruta}`, { method: metodo, headers: cab, body: datos === undefined ? undefined : JSON.stringify(datos) });
    } catch {
      throw new Error('No hay conexión con Nuvona. Revisa tu conexión e inténtalo de nuevo.');
    }
    if (r.status === 401 && reintento && sesion.refresco && await renovar()) {
      return pedir(ruta, { metodo, datos, respuesta, reintento: false });
    }
    if (!r.ok) {
      const error = new Error(mensajeError(await r.json().catch(() => null)));
      error.estado = r.status;
      throw error;
    }
    if (r.status === 204) return null;
    return respuesta === 'blob' ? r.blob() : r.json();
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { BASE, sesion, pedir, esc };
})();
