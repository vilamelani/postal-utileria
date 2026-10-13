/* =========================================================================
   GUITA · Utilería digital · Configuración por defecto
   Todo lo que está acá se puede cambiar también desde el menú oculto
   (mantener apretada 1 segundo la esquina superior izquierda).
   Los textos marcados [INVENTADO] no están en el guion: confirmar con Mel.
   ========================================================================= */

window.GUITA_DEFAULTS = {
  // Nombre de la app tipo Instagram (provisorio, se cambia acá o en el menú)
  appName: 'Postal',

  // Celular
  platform: null,          // null = se detecta solo (iPhone → 'ios', resto → 'android')
  theme: 'light',          // 'light' | 'dark'
  statusBar: 'auto',       // 'auto' | 'on' | 'off'  (barra de estado falsa)
  clockMode: 'real',       // 'real' | 'fixed'
  clockFixed: '18:42',
  dateMode: 'real',        // 'real' | 'fixed'
  dateFixed: '2026-10-12',
  battery: 76,
  charging: false,
  carrier: 'Austral',      // operadora ficticia, siempre fija
  signal: 4,               // 0 a 4 rayitas
  wifi: true,
  autoFullscreen: true,    // en Android pide pantalla completa al primer toque
  launchScene: 'menu',     // 'menu' o una escena ('7E', '29', '38'...): dónde abre la app al tocar el ícono

  // Cuenta de la marca
  account: {
    username: 'larevivida',
    fullName: 'La Revivida',
    email: 'hola@larevivida.com.ar',          // [INVENTADO]
    password: 'yerbacircular',                 // [INVENTADO] (se ve como puntitos)
    bio: 'Yerba premium estacionada orgánica 🧉\nDe tu mate al mundo y otra vez a tu mate' // [INVENTADO] sale de la etiqueta de Arte
  },

  // Esc 7E · Crean la cuenta
  s7E: {
    start: 'welcome',      // 'welcome' | 'form' | 'profile'
    fieldMode: 'magic',    // 'magic' (cualquier tecla escribe el texto correcto) | 'filled' | 'free'
    steps: [0, 85],        // seguidores: arranca en el 1º y cada refresh pasa al siguiente
    posts: 0,
    following: 0,
    showBio: false
  },

  // Esc 7G · Actualizan seguidores
  s7G: {
    steps: [85, 435, 3317],
    posts: 1,
    following: 0,
    showBio: true
  },

  // Esc 9H · El celular vibra hasta caerse
  s9H: {
    trigger: 'both',       // 'timer' | 'tap' | 'both'
    delay: 8,              // segundos de pantalla negra antes de que arranque (temporizador)
    interval: 1.6,         // segundos entre notificaciones al principio
    minInterval: 0.35,     // ritmo máximo cuando se acelera
    accelerate: true,
    vibrate: 'continuous'  // 'continuous' | 'each' | 'off'
  },

  /* ===================== EPISODIO 2 y 3 ===================== */

  // Cuenta de Mica (influencer)
  mica: {
    username: 'micarr',
    fullName: 'Mica R.',
    bio: 'Skincare · Lifestyle · GRWM ✨\nBuenos Aires 📍\nCódigo MICARR7 💖',   // [INVENTADO] (el código sale del guion)
    link: 'micarr.com.ar',                                                   // [INVENTADO]
    posts: 214,                                                              // [INVENTADO]
    following: 845,
    highlights: ['Rutina', 'Mi bebé', 'Eventos', 'Canjes', 'Detrás'],        // [INVENTADO]
    mutuals: 'sofi.glow, cami.makeup y 312 más siguen esta cuenta'          // [INVENTADO] (lo ve María Laura en la 29)
  },
  // Cuenta de María Laura (sólo se ve su foto en la barra de abajo)
  mlaura: { username: 'mlaura.rep' },

  // Esc 15 · Ariel mira un video de skincare
  s15: { caption: 'Mi rutina de skincare de noche 🌙✨', likes: '12,4 mil', comments: '348', shares: '1.203' },   // [INVENTADO]

  // Esc 21 · Notificación "Micar ha publicado un nuevo video" → al tocarla se abre el reel
  s21: {
    start: 'lock', trigger: 'both', delay: 6,
    text: '{u} ha publicado un nuevo video',
    caption: 'Un día conmigo ☀️ ¿Les muestro más? 👀', likes: '8.932', comments: '201', shares: '644'          // [INVENTADO]
  },

  // Esc 29B/29D · María Laura muestra el perfil de Mica: cada refresh pasa al siguiente número
  s29: { steps: [15030, 20070, 30020] },

  // Esc 38 · Perfil propio de Mica → "+" → EN VIVO → iniciar transmisión
  s38: { followers: 41800, askCameraOnEnter: true },                       // seguidores: [INVENTADO]

  // Esc 39 · Notificación de vivo en el celular de María Laura
  s39: { start: 'lock', trigger: 'both', delay: 5, text: '{u} está transmitiendo en VIVO' },

  // Esc 40 · El vivo (también se llega desde la 38)
  s40: {
    viewersStart: 140,
    viewersTarget: 15000,
    rampSec: 10,            // segundos para llegar de 140 a 15.000
    phase2At: 20,           // a los X segundos cambian los comentarios (horror). 0 = sólo a mano
    phase3At: 0,            // a los X segundos llegan los comentarios de apoyo (esc 42). 0 = sólo a mano
    viewersPhase3: 45000,   // fase 3: el contador sube hasta acá
    startMuted: false
  },

  refreshMs: 900           // cuánto gira la ruedita del pull-to-refresh
};

/* Notificaciones de la escena 9H. type: 'dm' (mensaje directo), 'follow', 'like'.
   Las dos primeras salen del guion (9B/9E); el resto es [INVENTADO]. */
window.GUITA_NOTIFS = [
  { type: 'dm', user: 'flor.mateina', text: 'Holaa, ¿tenés stock?' },
  { type: 'dm', user: 'juli_rocha', text: 'Necesito seis paquetes para mañana.' },
  { type: 'follow', user: 'tomi.fdz' },
  { type: 'dm', user: 'caro.palermo', text: 'Holii, ¿hacen envíos a San Isidro?' },
  { type: 'like', user: 'agus_mateando', others: 23 },
  { type: 'dm', user: 'nachito.92', text: 'Buenas, ¿qué tal? Quería saber si hacen venta al por mayor. gracias' },
  { type: 'dm', user: 'lu.campos', text: '¿Cuánto sale el medio kilo?' },
  { type: 'follow', user: 'pao.rios' },
  { type: 'dm', user: 'el_gordo_mati', text: 'Me llegó y está buenísima, quiero dos más 🧉' },
  { type: 'dm', user: 'sofi.verde', text: '¿Siguen tomando pedidos?' },
  { type: 'like', user: 'mili.sanz', others: 57 },
  { type: 'dm', user: 'fran_quiroga', text: '¿Aceptan transferencia? Pasame el alias porfa' },
  { type: 'follow', user: 'rocio.yerbera' },
  { type: 'dm', user: 'santi.bsas', text: '¿Hacen envíos a zona oeste?' },
  { type: 'dm', user: 'dami_ok', text: 'La probé en lo de mi tía, ¿cómo pido?' },
  { type: 'dm', user: 'meli.gomez', text: 'Holaaa quiero 3!!' },
  { type: 'follow', user: 'joaco.pz' },
  { type: 'dm', user: 'vale.mate', text: '¿Cuándo reponen?' },
  { type: 'dm', user: 'cami_bv', text: '¿Tienen local o es solo envío?' },
  { type: 'like', user: 'flor.mateina', others: 112 },
  { type: 'dm', user: 'ger.ledesma', text: 'Necesito 10 para la oficina, ¿me hacen precio?' },
  { type: 'dm', user: 'luli.ok', text: 'Hola! Me la recomendaron, ¿cómo compro?' },
  { type: 'follow', user: 'martu.sosa' },
  { type: 'dm', user: 'eze_fer', text: '¿Llegan hoy a Caballito?' },
  { type: 'dm', user: 'belu.arce', text: '¿Hay stock de la orgánica?' },
  { type: 'dm', user: 'nico.villa', text: 'Holaa, ¿tenés stock?' },
  { type: 'like', user: 'ro.medina', others: 245 },
  { type: 'dm', user: 'ani.k', text: 'Quiero hacer un pedido grande 🙏' },
  { type: 'follow', user: 'pili.ferrari' },
  { type: 'dm', user: 'gaby.mate', text: '¿Me reservás dos para el sábado?' }
];

/* Comentarios del vivo (esc 40 y 42). Los primeros de cada fase son los del guion,
   en ese orden; después se mezclan con los [INVENTADO]. */
window.GUITA_LIVE = {
  phase1: ['¡Llegó el día!', '¡Holisss!', '¡Queremos ver el cambio!', '¡Fin del reto!', '¡Mica te queremos ver!',
    'holaaa 😍', 'llegué!!', '¿Cómo te quedó la piel?', 'yo también hice el reto 🙋‍♀️', 'muéstranos!!', 'te amo Mica', 'la reina 👑',
    'hola desde Córdoba!', 'ya me compré la crema', 'quiero ver el antes y después', '🔥🔥🔥', '😍😍', '¿y el código?', 'día 7!!!'],
  phase2: ['¿Qué te pasó?', '¿Qué tenés en la cara?', 'Es joda, ¿no?', '¿¿¿???', 'WTF???', '¿Te quemó?', 'Denuncien a la marca', 'Dios mío, qué horror',
    'noooo 😱', 'es un filtro?', 'Mica estás bien??', 'andá al médico por favor', 'yo la estoy usando 😰', 'qué es eso', '😨😨', 'no puede ser', 'devuelvan la plata'],
  phase3: ['Al fin alguien que se muestra tal cual es', 'Te bancamos, Mica', 'Mica, sos lo más', 'Aguante mostrarse real', 'Yendo a prender fuego a la marca',
    'La más auténtica', 'Qué ovarios para mostrarte así', 'Al fin alguien real', 'Aguante Mica', 'Basta de filtros', 'Cancelemos ya a la marca',
    '❤️❤️❤️', 'te queremos!!', 'gracias por mostrarlo', '👏👏👏', 'sos enorme', 'real > filtro'],
  users: ['sofi.glow', 'cami.makeup', 'luu.martinez', 'agus.skin', 'flor_bsas', 'meli.rios', 'juli.ferraro', 'dani_beauty', 'rochi.ok', 'pili.mendez',
    'valen.sz', 'brenda.lux', 'maca_ok', 'nati.gomez', 'tini.fan22', 'abril.rm', 'lara.vidal', 'mora_paz', 'emi.acosta', 'clara.nuñez',
    'ro.benitez', 'ailu.cs', 'jaz.quiroga', 'ceci_luna', 'tomi.rey', 'marti.k', 'bel.ortiz', 'yami.ok', 'guada.p', 'sol.mansilla',
    'cande.vera', 'mili_fit', 'ines.dl', 'pau.rossi', 'mica.fan.club', 'lucre.ss', 'vicky.cano', 'oriana_m', 'eli.bazan', 'kari.mt']
};
