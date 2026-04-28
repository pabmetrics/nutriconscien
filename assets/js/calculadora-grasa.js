let sexo = 'mujer';

function setSexo(valor) {
  sexo = valor;
  document.getElementById('btnMujer').classList.toggle('toggle-btn--active', valor === 'mujer');
  document.getElementById('btnHombre').classList.toggle('toggle-btn--active', valor === 'hombre');
}

// Rangos CUN-BAE por sexo
const RANGOS_GRASA = {
  mujer:  { bajo: [0, 20],    normal: [20, 30],  sobrepeso: [30, 35],  obesidad: [35, 100] },
  hombre: { bajo: [0, 10],    normal: [10, 20],  sobrepeso: [20, 25],  obesidad: [25, 100] }
};

// Rangos IMC estándar
const RANGOS_IMC = {
  bajo:      [0, 18.5],
  normal:    [18.5, 25],
  sobrepeso: [25, 30],
  obesidad:  [30, 100]
};

function clasificarGrasa(valor, sexo) {
  const r = RANGOS_GRASA[sexo];
  if (valor < r.normal[0])    return { label: 'Bajo', clase: 'bajo' };
  if (valor < r.sobrepeso[0]) return { label: 'Normal', clase: 'normal' };
  if (valor < r.obesidad[0])  return { label: 'Sobrepeso', clase: 'sobrepeso' };
  return { label: 'Obesidad', clase: 'obesidad' };
}

function clasificarIMC(valor) {
  if (valor < 18.5) return { label: 'Bajo peso', clase: 'bajo' };
  if (valor < 25)   return { label: 'Normal', clase: 'normal' };
  if (valor < 30)   return { label: 'Sobrepeso', clase: 'sobrepeso' };
  return { label: 'Obesidad', clase: 'obesidad' };
}

// Calcula posición % del marcador en la barra (0-100)
function calcPosGrasa(valor, sexo) {
  const r = RANGOS_GRASA[sexo];
  const min = 0, max = r.obesidad[0] + 10;
  return Math.min(Math.max((valor / max) * 100, 2), 97);
}

function calcPosIMC(valor) {
  const min = 10, max = 40;
  return Math.min(Math.max(((valor - min) / (max - min)) * 100, 2), 97);
}

function setMarker(markerId, pct, clase) {
  const marker = document.getElementById(markerId);
  marker.style.left = pct + '%';
  marker.className = 'fat-scale__marker fat-scale__marker--' + clase;
}

function calcular() {
  const edad   = parseFloat(document.getElementById('edad').value);
  const peso   = parseFloat(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  const grasa  = parseFloat(document.getElementById('grasa').value);
  const errorEl = document.getElementById('calcError');

  if (!edad || !peso || !altura || !grasa || peso < 30 || altura < 100 || grasa < 3 || grasa > 70) {
    errorEl.textContent = 'Por favor, rellena todos los campos correctamente.';
    return;
  }
  errorEl.textContent = '';

  // IMC
  const alturaM = altura / 100;
  const imc = peso / (alturaM * alturaM);

  // Clasificaciones
  const clasGrasa = clasificarGrasa(grasa, sexo);
  const clasIMC   = clasificarIMC(imc);

  // Composición
  const masaGrasa = (grasa / 100) * peso;
  const masaMagra = peso - masaGrasa;

  // Rellenar grasa
  document.getElementById('resFatValue').textContent = grasa.toFixed(1) + '%';
  const badgeGrasa = document.getElementById('resFatBadge');
  badgeGrasa.textContent = clasGrasa.label;
  badgeGrasa.className = 'fat-badge fat-badge--' + clasGrasa.clase;
  setMarker('fatMarker', calcPosGrasa(grasa, sexo), clasGrasa.clase);

  // Rellenar IMC
  document.getElementById('resIMCValue').textContent = imc.toFixed(1);
  const badgeIMC = document.getElementById('resIMCBadge');
  badgeIMC.textContent = clasIMC.label;
  badgeIMC.className = 'fat-badge fat-badge--' + clasIMC.clase;
  setMarker('imcMarker', calcPosIMC(imc), clasIMC.clase);

  // Labels rangos grasa
  const r = RANGOS_GRASA[sexo];
  document.getElementById('fatLabels').innerHTML = `
    <span>0%</span>
    <span>${r.normal[0]}%</span>
    <span>${r.sobrepeso[0]}%</span>
    <span>${r.obesidad[0]}%</span>
  `;
  document.getElementById('imcLabels').innerHTML = `
    <span>10</span><span>18.5</span><span>25</span><span>30</span>
  `;

  // Descripciones
  const descGrasa = {
    bajo:      'Tu porcentaje de grasa está por debajo del rango saludable. Un nivel muy bajo de grasa puede afectar funciones hormonales y metabólicas.',
    normal:    '¡Enhorabuena! Tu porcentaje de grasa se encuentra dentro del rango saludable para tu sexo.',
    sobrepeso: 'Tu porcentaje de grasa se sitúa en el rango de sobrepeso. Pequeños cambios en alimentación y actividad física pueden ayudarte a alcanzar el rango saludable.',
    obesidad:  'Tu porcentaje de grasa indica obesidad. Te recomendamos consultar con una profesional para diseñar un plan personalizado.'
  };
  const descIMC = {
    bajo:      'Tu IMC indica peso por debajo de lo normal. Es recomendable consultar con una profesional para valorar tu estado nutricional.',
    normal:    'Tu IMC se encuentra en el rango normal. Recuerda que el IMC es solo un indicador y debe interpretarse junto con el % de grasa.',
    sobrepeso: 'Tu IMC indica sobrepeso. Ten en cuenta que el IMC no diferencia entre músculo y grasa.',
    obesidad:  'Tu IMC está en rango de obesidad. Consulta con una nutricionista para un plan adaptado a tus necesidades.'
  };

  document.getElementById('resFatDesc').textContent = descGrasa[clasGrasa.clase];
  document.getElementById('resIMCDesc').textContent = descIMC[clasIMC.clase];

  // Composición
  document.getElementById('resMasaGrasa').textContent = masaGrasa.toFixed(1) + ' kg';
  document.getElementById('resMasaMagra').textContent = masaMagra.toFixed(1) + ' kg';

  // Rangos de referencia
  document.getElementById('referenceBox').innerHTML = `
    <p class="reference-box__title">Rangos de referencia para ${sexo === 'mujer' ? 'mujeres' : 'hombres'}</p>
    <div class="reference-table">
      <div class="ref-row ref-row--bajo">
        <span class="ref-dot"></span>
        <span class="ref-label">Bajo</span>
        <span class="ref-range">&lt; ${r.normal[0]}%</span>
      </div>
      <div class="ref-row ref-row--normal">
        <span class="ref-dot"></span>
        <span class="ref-label">Normal</span>
        <span class="ref-range">${r.normal[0]}% – ${r.sobrepeso[0]}%</span>
      </div>
      <div class="ref-row ref-row--sobrepeso">
        <span class="ref-dot"></span>
        <span class="ref-label">Sobrepeso</span>
        <span class="ref-range">${r.sobrepeso[0]}% – ${r.obesidad[0]}%</span>
      </div>
      <div class="ref-row ref-row--obesidad">
        <span class="ref-dot"></span>
        <span class="ref-label">Obesidad</span>
        <span class="ref-range">&gt; ${r.obesidad[0]}%</span>
      </div>
    </div>
  `;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display     = 'block';
  document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
