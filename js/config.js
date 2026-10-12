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
  launchScene: 'menu',     // 'menu' | '7E' | '7G' | '9H' : dónde abre la app al tocar el ícono

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
