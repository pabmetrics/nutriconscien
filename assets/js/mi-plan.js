// mi-plan.html: zona de cliente. Todo lo que se ve sale de la API (/yo/*) y es solo de la persona.
'use strict';

(() => {
  const { pedir, sesion, esc } = NuvidaAPI;
  if (!sesion.activa) { location.replace('cuenta.html'); return; }

  const $ = s => document.querySelector(s);
  const contenido = $('#contenido');
  const msg = $('#mensaje');
  const TOMAS = { desayuno: 'Desayuno', media_manana: 'Media mañana', comida: 'Comida', merienda: 'Merienda', cena: 'Cena' };
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const ACTIVIDAD = {
    sedentario: ['Sedentaria', 'Poco o ningún ejercicio'],
    ligero: ['Ligera', 'Ejercicio suave 1–3 días por semana'],
    moderado: ['Moderada', 'Ejercicio 3–5 días por semana'],
    activo: ['Activa', 'Ejercicio intenso 6–7 días por semana'],
    muy_activo: ['Muy activa', 'Doble entrenamiento o trabajo muy físico'],
  };
  const OBJETIVO = { perder: 'Perder grasa', mantener: 'Mantenerme y comer mejor', ganar: 'Ganar peso o músculo' };
  let yo = null;

  const aviso = (texto, tipo = 'info') => { msg.textContent = texto; msg.className = `mensaje mensaje--${tipo}`; if (texto) msg.scrollIntoView({ block: 'nearest' }); };
  const fecha = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const num = (v, d = 0) => (v == null ? '–' : Number(v).toLocaleString('es-ES', { maximumFractionDigits: d }));
  async function accion(fn, boton) {
    if (boton) boton.disabled = true;
    try { aviso(''); await fn(); } catch (e) {
      if (e.estado === 401) { sesion.cerrar(); location.replace('cuenta.html'); return; }
      aviso(e.message, 'error');
    } finally { if (boton) boton.disabled = false; }
  }
  function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  $('#salir').addEventListener('click', () => { sesion.cerrar(); location.href = 'index.html'; });

  // ── Carga y estado ─────────────────────────────────────────────────────────
  async function cargar() {
    yo = await pedir('/yo');
    $('#saludo').textContent = `Hola, ${yo.nombre}`;
    if (!yo.perfil) {
      $('#subtitulo').textContent = 'Para preparar tu plan necesitamos conocerte un poco. Son 3 minutos.';
      return pintarPerfil();
    }
    $('#subtitulo').textContent = yo.plan
      ? `Tu plan: ${yo.plan.nombre} · ${yo.plan.cancelado ? 'cancelado, sigue activo hasta el' : 'activo hasta el'} ${fecha(yo.plan.periodo_fin)}` : '';
    const partes = [tarjetaObjetivos()];
    if (!yo.perfil.derivar) {
      if (yo.plan) partes.push('<div id="menuZona"><div class="tarjeta"><p>Cargando tu menú…</p></div></div>', tarjetaCheckin(), tarjetaChat());
      else if (yo.pendiente) partes.push(tarjetaPendiente());
      else partes.push('<div id="planesZona" class="tarjeta"><p>Cargando planes…</p></div>');
    }
    partes.push(tarjetaCuenta());
    contenido.innerHTML = partes.join('');
    enlazarCuenta();
    if (yo.perfil.derivar) return;
    if (yo.plan) { enlazarChat(); await pintarMenu(); enlazarCheckin(); } else if (!yo.pendiente) await pintarPlanes();
  }

  // ── Objetivos ──────────────────────────────────────────────────────────────
  function tarjetaObjetivos() {
    const p = yo.perfil;
    if (p.derivar) {
      return `<div class="tarjeta"><h2>Tu caso necesita una consulta</h2><p>${esc(p.mensaje_derivacion)}</p>
        <p>Escríbenos a <a href="mailto:ana.dnutricion@gmail.com">ana.dnutricion@gmail.com</a> y te orientamos.</p>
        <p class="aviso-legal">Si te has equivocado al responder, puedes corregirlo en «Mis datos».</p></div>`;
    }
    const o = p.objetivos;
    return `<div class="tarjeta"><h2>Tus objetivos diarios</h2>
      <div class="cifras">
        <div class="cifra"><b>${num(o.kcal)}</b><span>kcal al día</span></div>
        <div class="cifra"><b>${num(o.proteinas_g)} g</b><span>proteínas</span></div>
        <div class="cifra"><b>${num(o.hidratos_g)} g</b><span>hidratos</span></div>
        <div class="cifra"><b>${num(o.grasas_g)} g</b><span>grasas</span></div>
      </div>
      <p class="aviso-legal">${OBJETIVO[p.objetivo]} · ${p.numero_comidas} comidas al día ·
        ${Object.entries(o.reparto).map(([t, k]) => `${TOMAS[t]} ${num(k)} kcal`).join(' · ')}</p>
      ${o.aviso ? `<p class="mensaje mensaje--info">${esc(o.aviso)}</p>` : ''}</div>`;
  }

  // ── Perfil (alta y edición) ────────────────────────────────────────────────
  async function pintarPerfil() {
    const [restricciones, cribado, ingredientes] = await Promise.all([
      pedir('/publico/restricciones'), pedir('/publico/cribado'), pedir('/publico/ingredientes'),
    ]);
    const p = yo.perfil || { sexo: 'mujer', actividad: 'ligero', objetivo: 'perder', numero_comidas: 4, restricciones: [], exclusiones: [], cribado: {}, cuestionario: {} };
    const radio = (nombre, valor, actual, texto, detalle = '') =>
      `<label><input type="radio" name="${nombre}" value="${valor}" ${String(actual) === String(valor) ? 'checked' : ''} required> ${texto}${detalle ? ` <small>· ${detalle}</small>` : ''}</label>`;
    contenido.innerHTML = `
      <form class="tarjeta" id="fPerfil" novalidate>
        <h2>Sobre ti</h2>
        <fieldset class="campo"><legend>Sexo</legend><div class="opciones">${radio('sexo', 'mujer', p.sexo, 'Mujer')}${radio('sexo', 'hombre', p.sexo, 'Hombre')}</div></fieldset>
        <div class="fila2">
          <label class="campo"><span>Fecha de nacimiento</span><input type="date" name="fecha_nacimiento" value="${esc(p.fecha_nacimiento)}" required max="${new Date().toISOString().slice(0, 10)}"></label>
          <label class="campo"><span>Altura (cm)</span><input type="number" name="altura_cm" min="120" max="230" value="${p.altura_cm ?? ''}" required inputmode="numeric"></label>
          <label class="campo"><span>Peso (kg)</span><input type="number" name="peso_kg" min="30" max="300" step="0.1" value="${p.peso_kg ?? ''}" required inputmode="decimal"></label>
        </div>
        <fieldset class="campo"><legend>Actividad física</legend><div class="opciones opciones--columna">
          ${Object.entries(ACTIVIDAD).map(([k, [t, d]]) => radio('actividad', k, p.actividad, t, d)).join('')}</div></fieldset>
        <fieldset class="campo"><legend>¿Qué quieres conseguir?</legend><div class="opciones">
          ${Object.entries(OBJETIVO).map(([k, t]) => radio('objetivo', k, p.objetivo, t)).join('')}</div></fieldset>
        <fieldset class="campo"><legend>¿Cuántas comidas haces al día?</legend><div class="opciones">
          ${[3, 4, 5].map(n => radio('numero_comidas', n, p.numero_comidas, String(n))).join('')}</div></fieldset>

        <h3>Alimentación</h3>
        <fieldset class="campo"><legend>¿Sigues alguna dieta o tienes alguna alergia o intolerancia?</legend><div class="opciones">
          ${restricciones.map(r => `<label><input type="checkbox" name="restricciones" value="${r.id}" ${p.restricciones.includes(r.id) ? 'checked' : ''}> ${esc(r.nombre)}</label>`).join('')}</div></fieldset>
        <label class="campo"><span>Alimentos que no tomas (no saldrán en tus menús)</span>
          <select name="exclusiones" multiple size="6">${ingredientes.map(i => `<option value="${i.id}" ${p.exclusiones.includes(i.id) ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}</select>
          <small>En el móvil, toca para marcar varios. En el ordenador, mantén Ctrl (o Cmd) pulsado.</small></label>
        <label class="campo"><span>Gustos y horarios (lo leerá tu nutricionista si tu plan lo incluye)</span>
          <textarea name="notas" rows="3" maxlength="1500" placeholder="Ej.: me encanta el pescado, como a las 15:00, entreno por la tarde…">${esc(p.cuestionario?.notas)}</textarea></label>

        <h3>Tu salud</h3>
        <p class="aviso-legal">Nuvida es un programa para personas adultas sanas. Si algo de esto te pasa, lo adecuado es una consulta con una dietista-nutricionista.</p>
        <div class="cribado">${Object.entries(cribado.preguntas).map(([k, texto]) => `<div class="cribado__fila"><span>${esc(texto)}</span>
          <div class="opciones">${radio(`c_${k}`, 'no', p.cribado[k] === false ? 'no' : (p.cribado[k] ? 'si' : ''), 'No')}${radio(`c_${k}`, 'si', p.cribado[k] ? 'si' : '', 'Sí')}</div></div>`).join('')}</div>

        <label class="form-consent" style="margin-top:16px"><input type="checkbox" name="acepto_salud" required ${yo.perfil ? 'checked' : ''}>
          <span>Doy mi consentimiento para que Nuvida trate estos datos de salud para calcular y preparar mi plan, como explica la <a href="legal.html#privacidad" target="_blank">política de privacidad</a>.</span></label>
        <div class="acciones"><button class="btn btn--primary" type="submit">${yo.perfil ? 'Guardar cambios' : 'Calcular mi plan'}</button>
          ${yo.perfil ? '<button class="btn btn--outline" type="button" id="cancelar">Cancelar</button>' : ''}</div>
      </form>`;
    const form = $('#fPerfil');
    $('#cancelar')?.addEventListener('click', () => accion(cargar));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const f = new FormData(form);
      const datos = {
        acepto_salud: f.get('acepto_salud') === 'on', sexo: f.get('sexo'), fecha_nacimiento: f.get('fecha_nacimiento'),
        altura_cm: Number(f.get('altura_cm')), peso_kg: Number(f.get('peso_kg')), actividad: f.get('actividad'),
        objetivo: f.get('objetivo'), numero_comidas: Number(f.get('numero_comidas')),
        restricciones: f.getAll('restricciones').map(Number), exclusiones: f.getAll('exclusiones').map(Number),
        cribado: Object.fromEntries(Object.keys(cribado.preguntas).map(k => [k, f.get(`c_${k}`) === 'si'])),
        cuestionario: f.get('notas') ? { notas: f.get('notas') } : {},
      };
      accion(async () => {
        await pedir('/yo/perfil', { metodo: 'PUT', datos });
        await cargar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, form.querySelector('[type=submit]'));
    });
  }

  // ── Planes ─────────────────────────────────────────────────────────────────
  async function pintarPlanes() {
    const planes = await pedir('/publico/planes');
    const zona = $('#planesZona');
    zona.innerHTML = `<h2>Elige tu plan</h2>
      <label class="form-consent" style="margin-bottom:12px"><input type="checkbox" id="inicioInmediato">
        <span>Quiero empezar antes de que acaben los 14 días de desistimiento. Sé que, si desisto, pagaré la parte proporcional del servicio ya recibido (<a href="legal.html#condiciones" target="_blank">condiciones</a>).</span></label>
      <div class="planes-lista">${planes.map(p => `
      <div class="plan-op"><div><b>${esc(p.nombre)}</b>
        <p>${p.con_revision ? 'Con revisión de nuestra nutricionista' : 'Automático'} · ${p.recurrente ? 'mensual' : 'pago único'}
        ${p.grupo ? ` · grupo «${esc(p.grupo.nombre)}» desde el ${fecha(p.grupo.fecha_inicio)}, ${p.grupo.plazas_libres} plazas` : ''}</p></div>
        ${p.disponible ? `<button class="btn btn--primary" data-plan="${p.plan}">Lo quiero</button>`
          : `<button class="btn btn--outline" data-espera="${p.plan}">Sin plazas: avísame</button>`}</div>`).join('')}</div>
      <p class="aviso-legal">Precios en la portada. Al reservar te guardamos la plaza y te escribimos para el pago.</p>`;
    zona.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b?.dataset.plan) accion(async () => {
        if (!$('#inicioInmediato').checked) throw new Error('Marca la casilla de inicio del servicio para poder reservar.');
        await pedir('/yo/inscripciones', { metodo: 'POST', datos: { plan: b.dataset.plan, inicio_inmediato: true } });
        await cargar();
      }, b);
      if (b?.dataset.espera) accion(async () => {
        await pedir('/publico/lista-espera', { metodo: 'POST', datos: { nombre: yo.nombre, email: yo.email, plan: b.dataset.espera, acepto_privacidad: true } });
        aviso('Te hemos apuntado: te avisamos cuando abramos el siguiente grupo.', 'ok');
      }, b);
    });
  }

  function tarjetaPendiente() {
    const p = yo.pendiente;
    return `<div class="tarjeta"><h2>Plaza reservada: ${esc(p.nombre)}</h2>
      <p>${p.grupo ? `Entras en el grupo «${esc(p.grupo.nombre)}», que empieza el ${fecha(p.grupo.fecha_inicio)}. ` : ''}
      Te escribiremos a <b>${esc(yo.email)}</b> para el pago. En cuanto esté, aquí tendrás tu menú.</p>
      <button class="btn btn--ghost" data-cancelar="1">Anular la reserva</button></div>`;
  }

  // ── Menú de la semana ──────────────────────────────────────────────────────
  async function pintarMenu() {
    const zona = $('#menuZona');
    const menus = await pedir('/yo/menus');
    const proximo = menus[0];
    const boton = '<button class="btn btn--primary" id="nuevoMenu">Preparar mi menú de la semana</button>';
    if (!proximo) {
      zona.innerHTML = `<div class="tarjeta"><h2>Tu menú</h2><p>Aún no tienes menú. Lo preparamos con tus calorías, tus gustos y nuestras recetas.</p>${boton}</div>`;
    } else if (proximo.estado !== 'aprobado') {
      zona.innerHTML = `<div class="tarjeta"><h2>Menú de la semana del ${fecha(proximo.semana_inicio)}</h2>
        <p>Nuestra nutricionista está revisando tu menú. Te avisaremos por email en cuanto esté listo.</p></div>`;
    } else {
      const menu = await pedir(`/yo/menus/${proximo.id}`);
      const siguiente = new Date(`${menu.semana_inicio}T12:00:00`);
      siguiente.setDate(siguiente.getDate() + 7);
      const yaTocaOtro = siguiente - new Date() < 3 * 86400000;  // a partir del viernes se puede pedir el siguiente
      zona.innerHTML = `<div class="tarjeta"><h2>Menú de la semana del ${fecha(menu.semana_inicio)}</h2>
        ${menu.nota_nutricionista ? `<div class="nota-ana"><b>Nota de tu nutricionista:</b> ${esc(menu.nota_nutricionista)}</div>` : ''}
        ${menu.avisos?.length ? `<div class="nota-ana"><b>Avisos para tu dieta.</b> Estos ingredientes son aptos para ti solo en ciertas versiones:
          <ul>${menu.avisos.map(a => `<li><b>${esc(a.ingrediente)}</b> (${esc(a.restriccion)}): ${esc(a.aviso)}</li>`).join('')}</ul></div>` : ''}
        ${menu.objetivos.motivo_ajuste ? `<p class="mensaje mensaje--info">Ajuste de esta semana: ${esc(menu.objetivos.motivo_ajuste)}</p>` : ''}
        <div class="dias" role="tablist">${DIAS.map((d, i) => `<button role="tab" data-dia="${i}" aria-selected="false">${d.slice(0, 3)}</button>`).join('')}</div>
        <div id="diaMenu"></div>
        <div class="acciones"><button class="btn btn--outline" id="compra">Lista de la compra</button>
          <button class="btn btn--outline" id="pdf">Descargar PDF</button>${yaTocaOtro ? boton : ''}</div>
        <div id="compraZona"></div></div>`;
      const pintarDia = dia => {
        zona.querySelectorAll('.dias button').forEach(b => b.setAttribute('aria-selected', String(Number(b.dataset.dia) === dia)));
        const items = menu.items.filter(i => i.dia === dia);
        $('#diaMenu').innerHTML = items.map(i => `<div class="comida">
          <div class="comida__toma">${TOMAS[i.toma]}</div>
          <div class="comida__receta">${esc(i.receta.nombre)}</div>
          <div class="comida__detalle">${num(i.raciones, 2)} ${Number(i.raciones) === 1 ? 'ración' : 'raciones'} · ${num(i.kcal)} kcal</div>
          <details data-slug="${esc(i.receta.slug)}" data-raciones="${i.raciones}"><summary>Ver receta</summary><p>Cargando…</p></details></div>`).join('')
          + `<p class="aviso-legal">Total del día: ${num(items.reduce((s, i) => s + i.kcal, 0))} kcal</p>`;
      };
      const hoy = (new Date().getDay() + 6) % 7;
      pintarDia(new Date() >= new Date(`${menu.semana_inicio}T00:00:00`) ? hoy : 0);
      zona.querySelector('.dias').addEventListener('click', e => { if (e.target.dataset.dia) pintarDia(Number(e.target.dataset.dia)); });
      zona.addEventListener('toggle', e => {
        const d = e.target;
        if (d.tagName !== 'DETAILS' || !d.open || d.dataset.cargada) return;
        d.dataset.cargada = '1';
        pedir(`/publico/recetas/${encodeURIComponent(d.dataset.slug)}`).then(r => {
          const factor = Number(d.dataset.raciones) / (r.raciones || 1);
          d.innerHTML = `<summary>Ver receta</summary>
            <ul>${r.ingredientes.map(x => `<li>${esc(x.nombre)}: ${num(x.gramos * factor)} g</li>`).join('')}</ul>
            <ol>${r.pasos.map(p => `<li>${esc(p.texto)}</li>`).join('')}</ol>`;
        }).catch(() => { d.innerHTML = '<summary>Ver receta</summary><p>No se ha podido cargar.</p>'; });
      }, true);
      $('#compra').addEventListener('click', e => accion(async () => {
        const filas = await pedir(`/yo/menus/${menu.id}/compra`);
        $('#compraZona').innerHTML = `<h3>Lista de la compra</h3><ul class="compra">${filas.map(f => `<li><span>${esc(f.ingrediente)}${(f.avisos || []).map(a => `<small class="compra__aviso">⚠ ${esc(a)}</small>`).join('')}</span><span>${num(f.gramos)} g</span></li>`).join('')}</ul>`;
      }, e.currentTarget));
      $('#pdf').addEventListener('click', e => accion(async () => {
        descargar(await pedir(`/yo/menus/${menu.id}/pdf`, { respuesta: 'blob' }), `menu-nuvida-${menu.semana_inicio}.pdf`);
      }, e.currentTarget));
    }
    $('#nuevoMenu')?.addEventListener('click', e => accion(async () => {
      await pedir('/yo/menus', { metodo: 'POST', datos: {} });
      await pintarMenu();
    }, e.currentTarget));
  }

  // ── Check-in semanal ───────────────────────────────────────────────────────
  function tarjetaCheckin() {
    const escala = (nombre, izq, der) => `<div class="opciones">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="${nombre}" value="${n}"> ${n}</label>`).join('')}</div>
      <small>1 = ${izq} · 5 = ${der}</small>`;
    return `<form class="tarjeta" id="fCheckin" novalidate><h2>¿Qué tal la semana?</h2>
      <p class="aviso-legal">Con esto ajustamos tu plan. Mejor el mismo día y a la misma hora cada semana.</p>
      <div class="fila2"><label class="campo"><span>Peso (kg)</span><input type="number" name="peso_kg" min="30" max="300" step="0.1" inputmode="decimal"></label>
        <label class="campo"><span>¿Cuánto del menú has seguido?</span><select name="adherencia_pct"><option value="">–</option>
          ${[100, 80, 60, 40, 20].map(v => `<option value="${v}">${v === 100 ? 'Todo' : `Más o menos un ${v} %`}</option>`).join('')}</select></label></div>
      <fieldset class="campo"><legend>Hambre</legend>${escala('hambre', 'nada', 'muchísima')}</fieldset>
      <fieldset class="campo"><legend>Energía</legend>${escala('energia', 'agotada', 'genial')}</fieldset>
      <label class="campo"><span>Algo que contar (opcional)</span><textarea name="notas" rows="2" maxlength="2000"></textarea></label>
      <button class="btn btn--primary" type="submit">Guardar</button></form>`;
  }
  function enlazarCheckin() {
    const form = $('#fCheckin');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      const n = k => (f.get(k) ? Number(f.get(k)) : null);
      accion(async () => {
        await pedir('/yo/checkins', { metodo: 'POST', datos: { peso_kg: n('peso_kg'), hambre: n('hambre'), energia: n('energia'),
          adherencia_pct: n('adherencia_pct'), notas: f.get('notas') || null } });
        form.reset();
        aviso('¡Guardado! Lo tendremos en cuenta para tu próximo menú.', 'ok');
      }, form.querySelector('[type=submit]'));
    });
  }

  // ── Chat de dudas (Telegram) ────────────────────────────────────────────────
  function tarjetaChat() {
    if (!window.NUVIDA?.chatDudas) return '';
    return `<div class="tarjeta" id="chatZona"><h2>Chat de dudas</h2>
      <p>Pregunta por Telegram tus dudas generales sobre el programa, los menús y las recetas. Responde un asistente con
        inteligencia artificial, solo con la documentación de Ana. No ve tu cuenta ni guarda la conversación:
        no le escribas datos personales ni de salud. Para tu caso concreto, escríbele a Ana.</p>
      <div class="acciones"><button class="btn btn--outline" type="button" id="chatEnlace">Usar el chat en Telegram</button></div></div>`;
  }
  function enlazarChat() {
    const b = $('#chatEnlace');
    if (!b) return;
    b.addEventListener('click', () => accion(async () => {
      const r = await pedir('/yo/chat-dudas', { metodo: 'POST' });
      $('#chatZona .acciones').innerHTML = `<a class="btn btn--primary" href="${esc(r.enlace)}" target="_blank" rel="noopener">Abrir Telegram</a>
        <small class="aviso-legal">El enlace sirve una vez y caduca en ${r.caduca_minutos} minutos. Tendrás acceso hasta el ${fecha(r.acceso_hasta)}.</small>`;
    }, b));
  }

  // ── Mi cuenta ──────────────────────────────────────────────────────────────
  function tarjetaCuenta() {
    return `<div class="tarjeta"><h2>Mi cuenta</h2><p class="aviso-legal">${esc(yo.email)}</p>
      ${yo.plan?.recurrente && !yo.plan.cancelado ? `<p class="aviso-legal">Plan ${esc(yo.plan.nombre)}: sin permanencia. Si lo cancelas, sigue activo hasta el ${fecha(yo.plan.periodo_fin)} y no se renueva.</p>` : ''}
      <div class="acciones"><button class="btn btn--outline" id="editar">Mis datos</button>
        ${yo.plan?.recurrente && !yo.plan.cancelado ? '<button class="btn btn--ghost" data-cancelar="1">Cancelar mi plan</button>' : ''}
        <button class="btn btn--outline" id="exportar">Descargar mis datos</button>
        <button class="btn btn--ghost" id="borrar">Borrar mi cuenta</button></div></div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cancelar]');
    if (!b) return;
    const texto = yo.plan ? `¿Cancelar tu plan? Seguirá activo hasta el ${fecha(yo.plan.periodo_fin)} y no se renovará.` : '¿Anular tu reserva de plaza?';
    if (!confirm(texto)) return;
    accion(async () => {
      const r = await pedir('/yo/inscripciones/cancelar', { metodo: 'POST' });
      await cargar();
      aviso(r.hasta ? `Plan cancelado. Sigue activo hasta el ${fecha(r.hasta)}.` : 'Reserva anulada.', 'ok');
    }, b);
  });

  function enlazarCuenta() {
    $('#editar').addEventListener('click', () => accion(async () => { $('#subtitulo').textContent = 'Cambia lo que necesites.'; await pintarPerfil(); }));
    $('#exportar').addEventListener('click', e => accion(async () => {
      const datos = await pedir('/yo/datos');
      descargar(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }), 'mis-datos-nuvida.json');
    }, e.currentTarget));
    $('#borrar').addEventListener('click', e => {
      if (!confirm('¿Seguro? Se borrarán tu cuenta y todos tus datos (perfil, menús y seguimiento). No se puede deshacer.')) return;
      accion(async () => { await pedir('/yo', { metodo: 'DELETE' }); sesion.cerrar(); location.href = 'index.html'; }, e.currentTarget);
    });
  }

  accion(cargar);
})();
