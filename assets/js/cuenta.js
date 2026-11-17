// cuenta.html: entrar, crear cuenta, olvido de contraseña, y los enlaces del email
// (#verificar=TOKEN confirma la cuenta; #reset=TOKEN pone una contraseña nueva).
'use strict';

(() => {
  const { pedir, sesion } = NuvidaAPI;
  const msg = document.getElementById('mensaje');
  const formularios = () => document.querySelectorAll('#caja form');
  const pestanas = document.querySelector('.pestanas');
  let tokenReset = null;

  // Mientras no se abran las cuentas (config.js), solo se puede entrar: nada de «Crear cuenta».
  if (!window.NUVIDA?.registroAbierto) {
    pestanas.querySelector('[data-vista="registro"]').remove();
    document.getElementById('fRegistro').remove();
    const aviso = document.createElement('p');
    aviso.className = 'mensaje mensaje--info';
    aviso.innerHTML = 'Todavía no abrimos cuentas nuevas. <button type="button" class="enlace" onclick="abrirListaEspera()">Apúntate a la lista de espera</button> y te avisamos con el primer grupo.';
    document.getElementById('fEntrar').after(aviso);
  }

  function aviso(texto, tipo = 'info') {
    msg.textContent = texto;
    msg.className = `mensaje mensaje--${tipo}`;
  }

  function mostrar(vista) {
    formularios().forEach(f => { f.hidden = f.dataset.vista !== vista; });
    pestanas.hidden = !['entrar', 'registro'].includes(vista);
    pestanas.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.vista === vista)));
    aviso('');
    const primero = document.querySelector(`form[data-vista="${vista}"] input`);
    if (primero) primero.focus();
  }

  pestanas.addEventListener('click', e => { if (e.target.dataset.vista) mostrar(e.target.dataset.vista); });
  document.addEventListener('click', e => { if (e.target.dataset.ir) mostrar(e.target.dataset.ir); });

  async function enviar(form, accion) {
    const boton = form.querySelector('button[type="submit"]');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    boton.disabled = true;
    try { await accion(Object.fromEntries(new FormData(form))); }
    catch (e) { aviso(e.message, 'error'); }
    finally { boton.disabled = false; }
  }

  document.getElementById('fEntrar').addEventListener('submit', e => {
    e.preventDefault();
    enviar(e.target, async d => {
      const t = await pedir('/auth/login', { metodo: 'POST', datos: { email: d.email, password: d.password } });
      if (t.rol !== 'cliente') {
        aviso('Esta cuenta es de gestión: entra desde el panel.', 'error');
        return;
      }
      sesion.guardar(t);
      location.href = 'mi-plan.html';
    });
  });

  document.getElementById('fRegistro')?.addEventListener('submit', e => {
    e.preventDefault();
    enviar(e.target, async d => {
      const r = await pedir('/auth/registro', { metodo: 'POST', datos: {
        nombre: d.nombre, email: d.email, password: d.password,
        acepto_terminos: Boolean(d.terminos), acepto_privacidad: Boolean(d.privacidad),
      } });
      e.target.reset();
      aviso(`${r.detalle} Si no lo ves, mira en la carpeta de spam.`, 'ok');
    });
  });

  document.getElementById('fOlvido').addEventListener('submit', e => {
    e.preventDefault();
    enviar(e.target, async d => {
      const r = await pedir('/auth/reset/solicitar', { metodo: 'POST', datos: { email: d.email } });
      aviso(r.detalle, 'ok');
    });
  });

  document.getElementById('fReset').addEventListener('submit', e => {
    e.preventDefault();
    enviar(e.target, async d => {
      await pedir('/auth/reset/confirmar', { metodo: 'POST', datos: { token: tokenReset, password: d.password } });
      sesion.cerrar();
      mostrar('entrar');
      aviso('Contraseña cambiada. Ya puedes entrar con la nueva.', 'ok');
    });
  });

  // Enlaces que llegan por email. El token va tras '#', así no viaja al servidor de la web.
  async function enlaceDelEmail() {
    const datos = new URLSearchParams(location.hash.slice(1));
    if (location.hash) history.replaceState(null, '', location.pathname);  // que el token no se quede en la barra ni en el historial
    if (datos.get('verificar')) {
      mostrar('entrar');
      try {
        await pedir('/auth/verificar', { metodo: 'POST', datos: { token: datos.get('verificar') } });
        aviso('¡Cuenta confirmada! Ya puedes entrar.', 'ok');
      } catch (e) { aviso(e.message, 'error'); }
    } else if (datos.get('reset')) {
      tokenReset = datos.get('reset');
      mostrar('reset');
    } else if (sesion.activa) {
      location.href = 'mi-plan.html';
    } else if (datos.has('registro') && window.NUVIDA?.registroAbierto) {
      mostrar('registro');
    }
  }
  enlaceDelEmail();
  window.addEventListener('hashchange', enlaceDelEmail);  // enlace abierto con la página ya cargada
})();
