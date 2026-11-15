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

  // Harris-Benedict revisada (Roza & Shizgal, 1984)
  let tmb;
  if (sexo === 'mujer') {
    tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad);
  } else {
    tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad);
  }

  const tdee = tmb * actividad;

  let calObjetivo, labelObjetivo, descObjetivo, avisoObjetivo = '';
  if (objetivo === 'deficit') {
    // Déficit de hasta 500 kcal, sin bajar del metabolismo basal ni de un mínimo absoluto.
    const minimo = Math.max(tmb, sexo === 'mujer' ? 1200 : 1500);
    calObjetivo  = Math.max(tdee - 500, minimo);
    labelObjetivo = 'Calorías para perder peso';
    if (calObjetivo > tdee - 500) {
      descObjetivo  = 'Déficit moderado ajustado a tu caso.';
      avisoObjetivo = 'Con tus datos, un déficit de 500 kcal te dejaría por debajo de un mínimo seguro, así que lo hemos limitado. '
        + (calObjetivo >= tdee
          ? 'Tu gasto ya está cerca de ese mínimo: en tu caso es mejor aumentar la actividad que comer menos.'
          : 'La pérdida será más lenta, pero sostenible.')
        + ' Te recomendamos hacerlo con supervisión profesional.';
      calObjetivo = Math.min(calObjetivo, tdee);
    } else {
      descObjetivo  = 'Déficit de 500 kcal/día. Pérdida estimada de ~0,5 kg/semana de forma saludable.';
    }
  } else if (objetivo === 'mantenimiento') {
    calObjetivo  = tdee;
    labelObjetivo = 'Calorías para mantenimiento';
    descObjetivo  = 'Ingesta igual a tu gasto total. Mantiene tu peso actual estable.';
  } else {
    calObjetivo  = tdee + 300;
    labelObjetivo = 'Calorías para ganar músculo';
    descObjetivo  = 'Superávit de 300 kcal/día. Favorece la ganancia muscular minimizando el aumento de grasa.';
  }

  // Macros orientativos sobre las calorías objetivo
  const proteinas    = Math.round(peso * 1.8);
  const calProtein   = proteinas * 4;
  const calFat       = Math.round(calObjetivo * 0.30);
  const grasas       = Math.round(calFat / 9);
  const calCarbs     = calObjetivo - calProtein - calFat;
  const carbohidratos = Math.round(calCarbs / 4);

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
