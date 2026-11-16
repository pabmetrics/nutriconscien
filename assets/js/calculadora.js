let sexo = 'mujer';

function setSexo(valor) {
  sexo = valor;
  document.getElementById('btnMujer').classList.toggle('toggle-btn--active', valor === 'mujer');
  document.getElementById('btnHombre').classList.toggle('toggle-btn--active', valor === 'hombre');
}

function calcular() {
  const edad   = parseFloat(document.getElementById('edad').value);
  const peso   = parseFloat(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  const actividad = parseFloat(document.querySelector('input[name="actividad"]:checked').value);
  const objetivo  = document.querySelector('input[name="objetivo"]:checked').value;
  const errorEl   = document.getElementById('calcError');

  if (!edad || !peso || !altura || edad < 18 || edad > 100 || peso < 30 || altura < 100) {
    errorEl.textContent = 'Por favor, rellena edad (18 o más), peso y altura correctamente.';
    return;
  }
  errorEl.textContent = '';

  // Mismas reglas que el plan (nuvona-app/api/app/servicios/nutricion.py), que son las de Ana:
  // Mifflin-St Jeor, −10 % para perder, +20 % para ganar, y nunca por debajo del basal ni de 1200/1500 kcal.
  const tmb = 10 * peso + 6.25 * altura - 5 * edad + (sexo === 'mujer' ? -161 : 5);
  const tdee = tmb * actividad;
  const minimo = Math.max(tmb, sexo === 'mujer' ? 1200 : 1500);
  const factor = { deficit: 0.9, mantenimiento: 1, volumen: 1.2 }[objetivo];
  let calObjetivo = tdee * factor;
  let labelObjetivo, descObjetivo, avisoObjetivo = '';
  if (calObjetivo < minimo) {
    calObjetivo = minimo;
    avisoObjetivo = 'Con tus datos, el objetivo te dejaría por debajo de un mínimo seguro, así que lo hemos limitado. '
      + (objetivo === 'deficit' && minimo >= tdee
        ? 'Tu gasto ya está cerca de ese mínimo: en tu caso es mejor aumentar la actividad que comer menos.'
        : 'La pérdida será más lenta, pero sostenible.')
      + ' Te recomendamos hacerlo con supervisión profesional.';
  }
  if (objetivo === 'deficit') {
    calObjetivo = Math.min(calObjetivo, tdee);
    labelObjetivo = 'Calorías para perder peso';
    descObjetivo = avisoObjetivo ? 'Déficit ajustado a tu caso.' : 'Un 10 % menos que tu gasto diario: pérdida gradual y sostenible.';
  } else if (objetivo === 'mantenimiento') {
    labelObjetivo = 'Calorías para mantenimiento';
    descObjetivo = 'Ingesta igual a tu gasto total. Mantiene tu peso actual estable.';
  } else {
    labelObjetivo = 'Calorías para ganar músculo';
    descObjetivo = 'Un 20 % más que tu gasto diario, para acompañar el entrenamiento de fuerza.';
  }

  // Macros: reparto de Ana por comida (4 comidas: desayuno 25 %, comida 37,5 %, merienda 12,5 %, cena 25 %),
  // cada una con su % de hidratos / proteínas / grasas.
  const REPARTO = [[0.25, 50, 20, 30], [0.375, 50, 25, 25], [0.125, 60, 20, 20], [0.25, 30, 30, 40]];
  let gHC = 0, gProt = 0, gGrasa = 0;
  REPARTO.forEach(([parte, hc, pr, gr]) => {
    const k = calObjetivo * parte;
    gHC += k * hc / 100 / 4; gProt += k * pr / 100 / 4; gGrasa += k * gr / 100 / 9;
  });
  const proteinas = Math.round(gProt);
  const carbohidratos = Math.round(gHC);
  const grasas = Math.round(gGrasa);
  const pct = g => Math.round(g / calObjetivo * 100);
  document.getElementById('pctProt').textContent = `~${pct(gProt * 4)} % de las calorías`;
  document.getElementById('pctCarbs').textContent = `~${pct(gHC * 4)} % de las calorías`;
  document.getElementById('pctFat').textContent = `~${pct(gGrasa * 9)} % de las calorías`;

  document.getElementById('resTMB').textContent         = Math.round(tmb) + ' kcal';
  document.getElementById('resTDEE').textContent        = Math.round(tdee) + ' kcal';
  document.getElementById('resObjetivoLabel').textContent = labelObjetivo;
  document.getElementById('resObjetivo').textContent    = Math.round(calObjetivo) + ' kcal';
  document.getElementById('resObjetivoDesc').textContent = descObjetivo;
  const avisoEl = document.getElementById('resObjetivoAviso');
  avisoEl.textContent = avisoObjetivo;
  avisoEl.style.display = avisoObjetivo ? 'block' : 'none';
  document.getElementById('resProt').textContent        = proteinas + 'g';
  document.getElementById('resCarbs').textContent       = carbohidratos + 'g';
  document.getElementById('resFat').textContent         = grasas + 'g';

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display     = 'block';

  document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
