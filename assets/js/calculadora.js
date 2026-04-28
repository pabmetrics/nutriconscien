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

  if (!edad || !peso || !altura || edad < 15 || peso < 30 || altura < 100) {
    errorEl.textContent = 'Por favor, rellena todos los campos correctamente.';
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

  let calObjetivo, labelObjetivo, descObjetivo;
  if (objetivo === 'deficit') {
    calObjetivo  = tdee - 500;
    labelObjetivo = 'Calorías para perder peso';
    descObjetivo  = 'Déficit de 500 kcal/día. Pérdida estimada de ~0.5 kg/semana de forma saludable.';
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
  document.getElementById('resProt').textContent        = proteinas + 'g';
  document.getElementById('resCarbs').textContent       = carbohidratos + 'g';
  document.getElementById('resFat').textContent         = grasas + 'g';

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display     = 'block';

  document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
