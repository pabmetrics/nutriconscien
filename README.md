# Nuvida

Web de **Nuvida**, un servicio de nutrición online sin citas: menús personalizados, lista de la compra y seguimiento semanal por Telegram, con IA en el día a día y supervisión de una dietista-nutricionista (Ana del Pozo).

Estado: **sin publicar**. De momento la web solo capta una lista de espera por grupos; el servicio (cuestionario, generador de menús y bot) aún no existe.

> Este repo se llama `nutriconscien` por la web anterior de consulta de Ana. Nuvida es un proyecto aparte; las páginas de Nutriconscien que quedan aquí son antiguas (ver "Páginas antiguas").

## Estructura

HTML, CSS y JS estáticos, sin build ni dependencias.

| Fichero | Qué es |
|---|---|
| `index.html` | Portada: hero, cómo funciona, planes, Ana, preguntas frecuentes y llamada final |
| `nosotros.html` | Quiénes somos (Ana, misión y pilares) |
| `blog.html` + `blog/post.html` | Listado y página de artículo. También tiene la newsletter (Brevo) |
| `blog/posts.json` + `blog/posts/*.md` | Artículos en Markdown (se pintan en el navegador con `marked`) |
| `calculadora-calorias.html` | Metabolismo basal (Mifflin-St Jeor, reglas de Ana, iguales que el plan), gasto diario y calorías/macros orientativos |
| `calculadora-grasa-corporal.html` | IMC y % de grasa (medido o estimado con CUN-BAE) |
| `legal.html` | Aviso legal, privacidad y cookies |
| `suscripcion-confirmada.html` | Página a la que vuelve Brevo tras confirmar la newsletter |
| `assets/css/nuvida.css` | Marca Nuvida y todos los componentes nuevos (se carga después de `style.css`) |
| `assets/js/lista-espera.js` | Modal de lista de espera común a todas las páginas (lo crea él mismo) |
| `assets/js/main.js` | Menú móvil, sombra de la cabecera y animación de entrada de tarjetas |

## Zona de cliente (conectada a la API)

`cuenta.html` y `mi-plan.html` hablan con la API de Nuvida (repo `nuvida-app`) mediante `assets/js/nuvida-api.js`:

- `cuenta.html`: entrar, crear cuenta, olvido de contraseña. Los enlaces de los emails llegan como `cuenta.html#verificar=…` y `cuenta.html#reset=…` (el token va tras `#` para que no llegue al servidor de la web, y se borra de la barra al leerlo).
- `mi-plan.html`: perfil y cribado, objetivos, elegir plan, menú de la semana (con la receta de cada comida), lista de la compra, PDF, check-in semanal, descargar y borrar mis datos.
- Dirección de la API: `<meta name="nuvida-api" content="https://…">` en la página; si no está, `localhost:8000` en local o el mismo host en el puerto 8503 (demo del mini PC). **Al publicar, añadir la meta con la URL real.**
- Todavía no están enlazadas desde el menú: se enlazarán cuando la API esté publicada.

## Recetas (páginas estáticas)

`recetas.html`, `recetas/*.html`, `sitemap.xml` y `robots.txt` **no se editan a mano**: los genera
`nuvida-app/api/scripts/generar_web_recetas.py` a partir del recetario, solo con las recetas que Ana ha publicado
en el panel (con sus macros de BEDCA y datos estructurados de schema.org para Google). Para actualizarlas:

```bash
cd ~/proyectos/nuvida-app/api
python -m scripts.exportar_recetario      # base de datos → recetario/ (commit en nuvida-app)
python -m scripts.generar_web_recetas     # recetario/ → páginas de esta web (commit aquí)
```

Cuando haya recetas publicadas, añadir «Recetas» al menú y al pie.

## Publicar en Hostinger (nuvida.es)

La web se publica tal cual desde este repo (sin compilar nada) con el despliegue por Git de Hostinger:

1. hPanel → **Sitios web** → `nuvida.es` → **Administrador de archivos**: vaciar `public_html` (Hostinger pone una página por defecto).
2. hPanel → `nuvida.es` → **Avanzado → GIT**: repositorio `https://github.com/pabmetrics/nutriconscien.git`, rama `main`, directorio vacío (= `public_html`). Crear y pulsar **Desplegar**.
3. En esa misma pantalla, **Despliegue automático**: copiar la URL del webhook y añadirla en GitHub → `nutriconscien` → Settings → Webhooks (evento *push*). Así cada commit se publica solo.
4. hPanel → **Seguridad → SSL**: activar el certificado gratuito para `nuvida.es` y `www.nuvida.es`.
5. Cloudflare Turnstile (newsletter) y EmailJS (lista de espera): añadir `nuvida.es` a los dominios permitidos.

`.htaccess` fuerza HTTPS, redirige las páginas antiguas a la portada y oculta `.git` y este README.

**Interruptores** (`assets/js/config.js`): `registroAbierto` y `listaEsperaEnApi` están apagados hasta aprobar los textos legales; la API tiene además su propio `REGISTRO_ABIERTO` en su `.env`. Para abrir: ponerlos a `true` aquí, `REGISTRO_ABIERTO=true` en la API y `nuvida.sh desplegar`.

## Verla en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Hace falta servirla (no vale abrir el fichero con doble clic), porque el blog carga los posts con `fetch`.

## Servicios externos

| Servicio | Para qué | Dónde se configura |
|---|---|---|
| **EmailJS** | Envío de la lista de espera (`nombre`, `email`, `plan`) | `assets/js/lista-espera.js`: clave pública, `service_zevc9t8`, plantilla `template_ge3yzyd`. La plantilla debe incluir `{{plan}}` para ver qué plan interesa |
| **Brevo** | Newsletter (doble opt-in) | Formulario en `blog.html` (`action` de sibforms) |
| **Cloudflare Turnstile** | Captcha de la newsletter | `blog.html`. Solo funciona en el dominio autorizado: en local da el error 110200, que es normal |
| **Google Fonts** | Tipografías Space Grotesk y Noto Sans Telugu | `<head>` de cada página y `nuvida.css` |

Las claves de EmailJS y Turnstile que aparecen son **públicas** (van en el navegador). No hay secretos en el repo.

## Tareas habituales

**Añadir un artículo al blog**
1. Crear `blog/posts/SLUG.md`. Para cerrar con una llamada a la acción, enlazar a `../index.html#planes`.
2. Añadir la entrada al principio de `blog/posts.json` (`slug`, `title`, `date`, `category`, `excerpt` y, opcionalmente, `image`).

**Cambiar precios o planes**
- Tarjetas en `index.html` (sección `#planes`).
- Opciones del desplegable en `assets/js/lista-espera.js` (`#wPlan`). Los botones de cada plan llaman a `abrirListaEspera('Nombre del plan')`, que debe coincidir con un `value` del desplegable.

**Abrir la lista de espera desde cualquier sitio**: `onclick="abrirListaEspera()"` (o con un plan entre comillas para dejarlo elegido). La página debe cargar el SDK de EmailJS y `lista-espera.js`.

## Criterios que hay que mantener

- **Las calculadoras no recomiendan dietas peligrosas**: el objetivo de pérdida nunca baja del metabolismo basal ni de 1200 kcal (mujer) / 1500 kcal (hombre), y avisa cuando limita. Solo adultos.
- **Sin promesas de resultados** ni testimonios inventados (publicidad sanitaria, RD 1907/1996). Los testimonios se añadirán cuando haya clientes reales de Nuvida, con permiso por escrito.
- **Transparencia con la IA**: la web dice claramente qué hace la IA y qué hace Ana.
- **Filtro de casos**: embarazo y lactancia, TCA, patologías, medicación y menores se derivan a consulta presencial (pregunta "¿Es para mí?").
- **Consentimiento**: todo formulario que recoja datos lleva la casilla de privacidad.

## Antes de publicar

- [ ] Domicilio profesional en `legal.html` (obligatorio por la LSSI).
- [ ] Colegio y número de colegiada de Ana en `legal.html`.
- [ ] Fecha de "última actualización" en `legal.html`.
- [ ] Dominio `nuvida.es` comprado (17/11). Falta: email de contacto con el dominio (ahora el de Ana, provisional) y registrar la marca en la OEPM (clase 44) con los primeros ingresos.
- [x] Redes sociales del pie: Instagram y TikTok @nuvida.es, X @nuvida_es (17/11).
- [ ] Confirmar precios (los actuales son provisionales).
- [ ] Decidir qué hacer con las páginas antiguas.
- [x] API publicada (17/11) y web conectada por `assets/js/config.js`; «Mi cuenta» en el menú (visible al abrir el registro).
- [ ] Textos legales nuevos aprobados → encender los interruptores de `config.js` y de la API.

## Páginas antiguas

`index-nutriconscien-backup.html`, `index-v1-backup.html`, `index-nuvida.html` y `landing-v1/2/3.html` son versiones anteriores (marca Nutriconscien o pruebas). No están enlazadas desde la web nueva y no se han actualizado. Hay que decidir si se borran antes de publicar.
