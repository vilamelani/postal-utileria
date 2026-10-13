/* =========================================================================
   GUITA · Utilería digital · Episodios 1, 2 y 3
   App tipo Instagram ficticia para usar en cámara.
   Gestos ocultos:
     · Mantener apretada ~1 s la esquina SUPERIOR IZQUIERDA → menú oculto
     · Doble toque en la esquina INFERIOR DERECHA → avanzar contador (perfiles)
     · Pantallas bloqueadas (9H, 21, 39): tocar la pantalla → dispara la notificación
   ========================================================================= */
(() => {
  'use strict';

  const D = window.GUITA_DEFAULTS;
  const NOTIFS = window.GUITA_NOTIFS;
  const LIVE_TXT = window.GUITA_LIVE;
  const $ = (s, el = document) => el.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function merge(a, b) {
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }

  /* ---------- almacenamiento local (por celular) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
  };

  /* IndexedDB para videos y fotos extra (no entran en localStorage) */
  const idb = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('guita', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('blobs');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    }));
    const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
      const t = db.transaction('blobs', mode); const st = t.objectStore('blobs');
      const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error);
    }));
    return {
      get: (k) => tx('readonly', (st) => st.get(k)).catch(() => null),
      set: (k, v) => tx('readwrite', (st) => st.put(v, k)).then(() => true).catch(() => false),
      del: (k) => tx('readwrite', (st) => st.delete(k)).catch(() => null)
    };
  })();
  const blobURLs = {};
  async function blobURL(key) {
    if (blobURLs[key]) return blobURLs[key];
    const b = await idb.get(key);
    if (!b) return null;
    blobURLs[key] = URL.createObjectURL(b);
    return blobURLs[key];
  }
  function forgetBlob(key) { if (blobURLs[key]) { URL.revokeObjectURL(blobURLs[key]); delete blobURLs[key]; } }

  /* ---------- dispositivo ---------- */
  const UA = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const canVibrate = typeof navigator.vibrate === 'function';

  /* ---------- estado ---------- */
  let S = merge(clone(D), store.get('guita.settings', {}));
  if (!S.platform) S.platform = isIOSDevice ? 'ios' : 'android';
  const save = () => store.set('guita.settings', S);

  const R = merge({ step: { '7E': 0, '7G': 0, '29': 0 }, sub: { '7E': null } }, store.get('guita.runtime', {}));
  const saveRuntime = () => store.set('guita.runtime', { step: R.step, sub: { '7E': R.sub['7E'] } });
  let route = 'menu';
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  const SILHOUETTE = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dbdbdb"/><circle cx="50" cy="40" r="18" fill="#fff"/><path d="M14 96c4-20 18-30 36-30s32 10 36 30z" fill="#fff"/></svg>');
  const DEFAULT_IMG = {
    avatar: 'img/avatar.jpg', post: 'img/post.jpg', wallpaper: null,
    micaAvatar: 'img/mica/avatar.jpg', mlAvatar: SILHOUETTE, viewerAvatar: SILHOUETTE
  };
  const img = (k) => store.get('guita.img.' + k, null) || DEFAULT_IMG[k];

  const MICA_GRID = [
    { src: 'img/mica/p01.jpg', icon: 'pin' }, { src: 'img/mica/p02.jpg', icon: 'reel' }, { src: 'img/mica/p03.jpg', icon: 'reel' },
    { src: 'img/mica/p04.jpg', icon: 'reel' }, { src: 'img/mica/p05.jpg', icon: 'reel' }, { src: 'img/mica/p06.jpg', icon: 'carousel' },
    { src: 'img/mica/p07.jpg', icon: 'reel' }, { src: 'img/mica/p08.jpg', icon: null }, { src: 'img/mica/p09.jpg', icon: 'reel' }
  ];
  const MICA_HL = ['img/mica/hl1.jpg', 'img/mica/hl2.jpg', 'img/mica/hl3.jpg', 'img/mica/hl4.jpg', 'img/mica/hl5.jpg'];
  const VIDEO_DEFAULT = { reel15: 'video/reel-skincare.mp4', reel21: 'video/reel-micar.mp4' };

  const phone = $('#phone');
  const sbEl = $('#sb');
  const screen = $('#screen');
  const sheetWrap = $('#sheetWrap');
  const sheet = $('#sheet');

  /* =======================================================================
     Escenas
     ======================================================================= */
  const SCENES = [
    { id: '7E', ep: 1, title: 'Crean la cuenta', who: 'Celular de La Revivida', desc: () => `Bienvenida → formulario → perfil vacío. Refresh: ${S.s7E.steps.map(fmtNum).join(' → ')}.` },
    { id: '7G', ep: 1, title: 'Actualizan seguidores', who: 'Celular de La Revivida', desc: () => `Perfil con 1 publicación. Refresh: ${S.s7G.steps.map(fmtNum).join(' → ')}.` },
    { id: '9H', ep: 1, title: 'Lluvia de notificaciones', who: 'Celular de La Revivida', desc: () => `Pantalla negra → se enciende y entran notificaciones sin parar${canVibrate ? ', con vibración' : ''}.` },
    { id: '15', ep: 2, title: 'Video de skincare', who: 'Celular de Ariel', desc: () => 'Reel de una influencer en pantalla completa. Ariel bloquea el celular con el botón.' },
    { id: '21', ep: 2, title: 'Micar publicó un video', who: 'Celular de Ariel', desc: () => 'Pantalla bloqueada → llega la notificación → al tocarla se abre el reel.' },
    { id: '29', ep: 3, title: 'Aumento de seguidores', who: 'Celular de María Laura', desc: () => `Perfil de @${S.mica.username}. Refresh: ${S.s29.steps.map(fmtNum).join(' → ')}.` },
    { id: '38', ep: 3, title: 'Prepara el vivo', who: 'Celular de Mica', desc: () => 'Perfil → “+” → EN VIVO con la cámara frontal → iniciar transmisión. Sigue como la 40.' },
    { id: '39', ep: 3, title: 'Notificación del vivo', who: 'Celular de María Laura', desc: () => `Pantalla bloqueada → “${fillU(S.s39.text)}”.` },
    { id: '40', ep: 3, title: 'El vivo', who: 'Celular de Mica', desc: () => `Arranca directo en vivo. Espectadores ${fmtNum(S.s40.viewersStart)} → ${fmtNum(S.s40.viewersTarget)} en ${S.s40.rampSec} s; los comentarios cambian a los ${S.s40.phase2At} s.` }
  ];
  const sceneById = (id) => SCENES.find((s) => s.id === id);
  const fillU = (t) => String(t || '').replace(/\{u\}/g, S.mica.username);

  /* =======================================================================
     Íconos (dibujos propios, genéricos)
     ======================================================================= */
  const I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3.5 10.2 12 3.5l8.5 6.7V20.5h-5.6v-6.2H9.1v6.2H3.5z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="7"/><path d="m20.5 20.5-4.7-4.7"/></svg>',
    add: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="M12 7.8v8.4M7.8 12h8.4"/></svg>',
    reels: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="M10 8.8v6.4l5.3-3.2z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m6 9.5 6 6 6-6"/></svg>',
    backIOS: '<svg viewBox="0 0 24 24"><path d="M15 4.5 7.5 12l7.5 7.5"/></svg>',
    backAnd: '<svg viewBox="0 0 24 24"><path d="M20 12H4.5M11 5l-7 7 7 7"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
    tagged: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4.5"/><circle cx="12" cy="10.2" r="3"/><path d="M6.6 19.5a6 6 0 0 1 10.8 0"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M3.5 8h3.4l1.8-2.8h6.6L17.1 8h3.4v11.3h-17z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    padlock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    torch: '<svg viewBox="0 0 24 24"><path d="M8 3h8v4l-2 3v11h-4V10L8 7z"/><path d="M12 13v2"/></svg>',
    cam: '<svg viewBox="0 0 24 24"><path d="M3.5 8h3.4l1.8-2.8h6.6L17.1 8h3.4v11.3h-17z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
    finger: '<svg viewBox="0 0 24 24"><path d="M7.5 5.5A8 8 0 0 1 20 12v2"/><path d="M4 9.5A8 8 0 0 1 5.5 7"/><path d="M8 20a10 10 0 0 0 1.5-6V12a2.5 2.5 0 0 1 5 0v1.5"/><path d="M12 12v2a14 14 0 0 1-2 7"/><path d="M17 16.5a17 17 0 0 1-1 4"/><path d="M6.5 17A7 7 0 0 0 7 14v-2a5 5 0 0 1 9.6-2"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>',
    dotsV: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
    personPlus: '<svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.6"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    reelBadge: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#fff" stroke="none"/><path d="M10 8.6v6.8l5.6-3.4z" fill="#000" stroke="none"/></svg>',
    pinBadge: '<svg viewBox="0 0 24 24"><path d="M14.5 3.5 20.5 9.5l-2.6.9-3.6 3.6.4 4.1-1.5 1.5-3.4-3.4-4.6 4.6-.9-.9 4.6-4.6-3.4-3.4L7 10.4l4.1.4 3.6-3.6z" fill="#fff" stroke="none"/></svg>',
    carouselBadge: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="14" rx="3" fill="#fff" stroke="none"/><path d="M8 4h9a3 3 0 0 1 3 3v9" stroke="#fff" stroke-width="2" fill="none"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.8-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 6.2-8 11-8 11z"/></svg>',
    bubble: '<svg viewBox="0 0 24 24"><path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12z"/></svg>',
    repost: '<svg viewBox="0 0 24 24"><path d="M17 3.5 20 6.5l-3 3"/><path d="M4 11.5v-2a3 3 0 0 1 3-3h13"/><path d="M7 20.5 4 17.5l3-3"/><path d="M20 12.5v2a3 3 0 0 1-3 3H4"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M21 3.5 10.2 13.8M21 3.5 14.4 21l-4.2-7.2L3 9.7z"/></svg>',
    music: '<svg viewBox="0 0 24 24"><path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>',
    flash: '<svg viewBox="0 0 24 24"><path d="M13 2.5 5.5 13.5h5.5l-1 8 7.5-11H12z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
    flip: '<svg viewBox="0 0 24 24"><path d="M4 9a8 8 0 0 1 14.5-3.5M20 15a8 8 0 0 1-14.5 3.5"/><path d="M18.8 2.5v3.3h-3.3M5.2 21.5v-3.3h3.3"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5"/></svg>',
    micOff: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5"/><path d="M3.5 3.5l17 17" stroke-width="2.2"/></svg>',
    question: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.8M12 16.8v.2"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    live: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.3 5.3a9.5 9.5 0 0 0 0 13.4M18.7 5.3a9.5 9.5 0 0 1 0 13.4"/></svg>',
    title: '<svg viewBox="0 0 24 24"><path d="M5 6h14M12 6v13"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9.5" r="2.6"/><path d="M15.5 14.2a5 5 0 0 1 6 5.3"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
  };
  const appIcon = (cls = '') => `<span class="app-icon ${cls}"><b>${esc((S.appName || 'P').trim().charAt(0).toUpperCase())}</b></span>`;

  /* ---------- barra de estado ---------- */
  function sigSVG() {
    const n = Math.max(0, Math.min(4, +S.signal));
    if (S.platform === 'ios') {
      let r = '';
      [4, 6.3, 8.6, 11].forEach((h, i) => { r += `<rect x="${i * 4.6}" y="${11.5 - h}" width="3.2" height="${h}" rx="1" opacity="${i < n ? 1 : .3}"/>`; });
      return `<svg width="18" height="12" viewBox="0 0 18 12">${r}</svg>`;
    }
    const lvl = [0, 0.3, 0.55, 0.78, 1][n];
    const x = 1 + 13 * lvl;
    return `<svg width="15" height="15" viewBox="0 0 15 15"><path d="M14 1 1 14h13z" opacity=".3"/><path d="M${x} ${14 - 13 * lvl} ${x} 14H1z"/>${n === 4 ? '<path d="M14 1 1 14h13z"/>' : ''}</svg>`;
  }
  function wifiSVG() {
    if (S.platform === 'ios') return '<svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.2c2.4 0 4.6.9 6.2 2.4l1.1-1.2A10.6 10.6 0 0 0 8 .5C5.2.5 2.6 1.6.7 3.4l1.1 1.2A9 9 0 0 1 8 2.2Z"/><path d="M8 5.4c1.5 0 2.9.6 4 1.5l1.1-1.2A7.6 7.6 0 0 0 8 3.7c-1.9 0-3.7.7-5.1 2l1.1 1.2c1.1-1 2.5-1.5 4-1.5Z"/><path d="M8 8.6c.7 0 1.3.2 1.8.6L8 11.2 6.2 9.2c.5-.4 1.1-.6 1.8-.6Z"/></svg>';
    return '<svg width="16" height="13" viewBox="0 0 16 13"><path d="M8 12.5 0 3.2A12.4 12.4 0 0 1 8 .4c3 0 5.8 1 8 2.8z"/></svg>';
  }
  function battSVG() {
    const b = Math.max(1, Math.min(100, +S.battery));
    const low = b <= 20 && !S.charging;
    if (S.platform === 'ios') {
      const col = S.charging ? '#34c759' : low ? '#ff3b30' : 'currentColor';
      const w = Math.max(1.5, 19.5 * b / 100);
      return `<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="${w}" height="9" rx="2.2" fill="${col}"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" opacity=".45"/>${S.charging ? '<path d="M12.6 2.2 8.8 7.2h2.6l-.9 3.6 3.8-5h-2.6z" fill="#fff" stroke="#000" stroke-width=".3"/>' : ''}</svg>`;
    }
    const h = 12.4 * b / 100;
    const col = low ? '#ff5449' : 'currentColor';
    return `<svg width="9" height="15" viewBox="0 0 9 15"><rect x="2.8" y="0" width="3.4" height="1.6" rx=".5"/><rect x=".6" y="1.4" width="7.8" height="13" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45"/><rect x="1.5" y="${14 - h}" width="6" height="${h}" rx=".9" fill="${col}"/>${S.charging ? '<path d="M5 4 2.6 8.6h2l-.6 3 2.4-4.6h-2z" fill="#000" opacity=".6"/>' : ''}</svg>`;
  }
  function timeStr() {
    if (S.clockMode === 'fixed' && /^\d{1,2}:\d{2}$/.test(S.clockFixed)) return S.clockFixed;
    const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function dateObj() {
    if (S.dateMode === 'fixed' && S.dateFixed) { const [y, m, d] = S.dateFixed.split('-').map(Number); return new Date(y, m - 1, d, 12); }
    return new Date();
  }
  function dateStr() {
    const d = dateObj();
    if (S.platform === 'ios') return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function renderSB(lock = false) {
    const left = lock ? esc(S.carrier) : timeStr();
    if (S.platform === 'ios') {
      sbEl.innerHTML = `<div class="sb sb-ios ${lock ? 'is-lock' : ''}"><span class="sb-left">${left}</span><span class="sb-right">${sigSVG()}${S.wifi ? wifiSVG() : ''}${battSVG()}</span></div>`;
    } else {
      sbEl.innerHTML = `<div class="sb sb-and"><span class="sb-left">${left}</span><span class="sb-right">${S.wifi ? wifiSVG() : ''}${sigSVG()}<span class="sb-pct">${Math.round(S.battery)}%</span>${battSVG()}</span></div>`;
    }
  }

  function fakeSBVisible() {
    if (S.statusBar === 'on') return true;
    if (S.statusBar === 'off') return false;
    if (isIOSDevice) return false;               // en iPhone se ve la barra real
    if (!isTouch) return true;                   // vista previa en computadora
    return !!document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches;
  }

  /* chromeState:
     tone: color del texto de la barra (auto/light/dark)
     hidden: sin barra ni indicador (pantallas de equipo, pantalla negra)
     overlay: barra encima del contenido con texto blanco (lock, reels, cámara, vivo)
     lock: muestra la operadora en lugar de la hora
     crew: pantalla de equipo (fondo marrón) */
  let chromeState = { tone: 'auto' };
  function applyChrome(next) {
    if (next) chromeState = next;
    phone.dataset.platform = S.platform;
    phone.dataset.theme = S.theme;
    phone.dataset.sbtone = chromeState.overlay ? 'overlay' : (chromeState.tone || 'auto');
    phone.dataset.hbtone = chromeState.overlay ? 'light' : (chromeState.tone || 'auto');
    phone.classList.toggle('no-chrome', !!chromeState.hidden);
    phone.classList.toggle('real-sb', !fakeSBVisible());
    renderSB(!!chromeState.lock);
    syncTopColor();
  }

  /* iOS pinta su barra con el color de la página: lo sincronizamos con la pantalla actual */
  const desktopPreview = matchMedia('(min-width: 640px) and (pointer: fine)');
  function topColor() {
    if (chromeState.crew) return '#1c1311';
    if (chromeState.hidden || chromeState.overlay || chromeState.lock || chromeState.dark) return '#000000';
    return S.theme === 'dark' ? '#000000' : '#ffffff';
  }
  function syncTopColor() {
    const c = topColor();
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = c; });
    if (!desktopPreview.matches) {
      document.documentElement.style.backgroundColor = c;
      document.body.style.backgroundColor = c;
    }
  }
  setInterval(() => { if (S.clockMode !== 'fixed') { renderSB(!!chromeState.lock); const t = $('.lk-time'); if (t) t.textContent = timeStr(); } }, 10000);

  /* =======================================================================
     Router
     ======================================================================= */
  const ROUTES = ['menu'].concat(SCENES.map((s) => s.id));
  function fromHash() {
    const h = (location.hash || '').replace('#', '');
    return ROUTES.includes(h) ? h : 'menu';
  }
  function resetTransient() {
    stopFeed(); stopLive();
    ['9H', '21', '39'].forEach((id) => { R.sub[id] = 'arm'; });
    R.sub['38'] = 'profile'; R.sub['40'] = 'live';
  }
  window.addEventListener('hashchange', () => {
    const prev = route;
    route = fromHash();
    resetTransient();
    if (!['38', '40'].includes(route) && ['38', '40'].includes(prev)) stopCam();
    render();
  });

  function render() {
    clearTimers();
    phone.dataset.route = route;
    switch (route) {
      case 'menu': return renderMenu();
      case '7E': return render7E();
      case '7G': return renderProfile('7G');
      case '9H': case '21': case '39': return renderLockScene(route);
      case '15': return renderReel('15');
      case '29': return renderProfile('29');
      case '38': return render38();
      case '40': return renderLive('40');
    }
  }
  const isBusy = () => (['9H', '21', '39'].includes(route) && R.sub[route] !== 'arm') || (route === '38' && R.sub['38'] === 'live') || route === '40';

  /* =======================================================================
     Menú de escenas (equipo)
     ======================================================================= */
  function renderMenu() {
    applyChrome({ tone: 'light', hidden: true, crew: true });
    const inst = isStandalone();
    const off = navigator.serviceWorker && navigator.serviceWorker.controller;
    const eps = [1, 2, 3].map((ep) => `
        <div class="ep-head">Episodio ${ep}</div>
        ${SCENES.filter((s) => s.ep === ep).map((s) => `
          <a class="scene" href="#${s.id}"><span class="tag">${s.id}</span><span><b>${esc(s.title)}</b><small><i>${esc(s.who)}</i> · ${esc(s.desc())}</small></span></a>`).join('')}`).join('');
    screen.innerHTML = `
      <div class="crew">
        <div class="kicker">GUITA · Utilería digital</div>
        <h1>Escenas</h1>
        <p class="sub">App: <b>${esc(S.appName)}</b> · Sistema: <b>${S.platform === 'ios' ? 'iPhone' : 'Android'}</b></p>
        ${eps}
        <button class="crew-btn ghost" data-act="open-sheet">Ajustes del celular y contenidos</button>
        <div class="howto">
          <h3>Gestos ocultos</h3>
          <ul>
            <li><b>Menú oculto:</b> mantener apretada 1 segundo la esquina <b>superior izquierda</b>.</li>
            <li><b>Refresh:</b> deslizar el perfil hacia abajo. Cada refresh pasa al número siguiente.</li>
            <li><b>Avanzar sin deslizar:</b> doble toque en la esquina <b>inferior derecha</b>.</li>
            <li><b>Reiniciar la toma:</b> menú oculto → “Reiniciar escena”.</li>
            <li><b>Pantallas bloqueadas (9H, 21, 39):</b> tocar <b>Armar</b>. Arranca con el temporizador o al tocar la pantalla.</li>
            <li><b>Cámara (38, 40):</b> la primera vez el celular pide permiso: aceptarlo antes de grabar.</li>
          </ul>
        </div>
        <p class="status-line">
          Instalada como app: <b class="${inst ? 'ok' : 'warn'}">${inst ? 'sí' : 'no'}</b> ·
          Sin conexión: <b class="${off ? 'ok' : 'warn'}">${off ? 'lista' : 'todavía no'}</b> ·
          Vibración: <b class="${canVibrate ? 'ok' : 'warn'}">${canVibrate ? 'disponible' : 'no disponible en este celular'}</b>
        </p>
      </div>`;
  }

  /* =======================================================================
     7E · Bienvenida / formulario / perfil
     ======================================================================= */
  function render7E() {
    const sub = R.sub['7E'] || S.s7E.start || 'welcome';
    R.sub['7E'] = sub;
    if (sub === 'welcome') return renderWelcome();
    if (sub === 'form') return renderForm();
    return renderProfile('7E');
  }

  function renderWelcome() {
    applyChrome({ tone: 'auto' });
    screen.innerHTML = `
      <div class="ig"><div class="w">
        <div class="w-lang">Español (Argentina)</div>
        <div class="w-mid">
          ${appIcon('xl')}
          <div class="w-field">Usuario, correo o número de celular</div>
          <div class="w-field">Contraseña</div>
          <button class="btn-primary" type="button">Iniciar sesión</button>
          <div class="w-forgot">¿Olvidaste tu contraseña?</div>
        </div>
        <div class="w-bottom">
          <button class="btn-outline" type="button" data-sub="7E:form">Crear cuenta nueva</button>
          <div class="w-brand wordmark">${esc(S.appName)}</div>
        </div>
      </div></div>`;
  }

  function renderForm() {
    applyChrome({ tone: 'auto' });
    const a = S.account;
    const mode = S.s7E.fieldMode;
    const field = (label, preset, type = 'text') => {
      const val = mode === 'filled' ? preset : '';
      return `<label class="fl"><input type="${type}" data-preset="${esc(preset)}" value="${esc(val)}" placeholder=" " autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="next"><span>${label}</span></label>`;
    };
    screen.innerHTML = `
      <div class="ig"><div class="f">
        <div class="f-top"><button type="button" data-sub="7E:welcome" aria-label="Volver">${S.platform === 'ios' ? I.backIOS : I.backAnd}</button></div>
        <div class="f-body">
          <h1>Creá tu cuenta</h1>
          <p class="lead">Completá tus datos para registrarte en ${esc(S.appName)}.</p>
          ${field('Celular o correo electrónico', a.email)}
          ${field('Nombre completo', a.fullName)}
          ${field('Nombre de usuario', a.username)}
          ${field('Contraseña', a.password, 'password')}
          <button class="btn-primary" type="button" id="createBtn">Crear cuenta</button>
          <p class="terms">Al registrarte, aceptás nuestras Condiciones, la Política de privacidad y la Política de cookies.</p>
        </div>
        <div class="f-foot">¿Ya tenés una cuenta? Iniciá sesión</div>
      </div></div>`;

    if (mode === 'magic') {
      screen.querySelectorAll('input[data-preset]').forEach((inp) => {
        inp.addEventListener('input', () => {
          const preset = inp.dataset.preset;
          const n = Math.min(inp.value.length, preset.length);
          if (inp.value !== preset.slice(0, n)) inp.value = preset.slice(0, n);
        });
      });
    }
    $('#createBtn').addEventListener('click', (e) => {
      const b = e.currentTarget;
      if (b.dataset.busy) return;
      b.dataset.busy = '1';
      if (document.activeElement) document.activeElement.blur();
      b.innerHTML = `<svg class="spin-dots" viewBox="0 0 24 24">${spinnerLines('#fff')}</svg>`;
      later(() => { R.sub['7E'] = 'profile'; R.step['7E'] = 0; saveRuntime(); render(); }, 1300);
    });
  }

  function spinnerLines(color) {
    let s = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * 45) * Math.PI / 180;
      const x1 = 12 + Math.sin(a) * 5, y1 = 12 - Math.cos(a) * 5, x2 = 12 + Math.sin(a) * 9, y2 = 12 - Math.cos(a) * 9;
      s += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity="${(0.25 + i * 0.75 / 7).toFixed(2)}"/>`;
    }
    return s;
  }

  /* =======================================================================
     Perfiles (7E, 7G, 29, 38) con pull-to-refresh
     ======================================================================= */
  function fmtNum(n) {
    n = Math.round(+n || 0);
    if (n < 10000) return n.toLocaleString('es-AR');
    if (n < 1000000) return (Math.floor(n / 100) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' mil';
    return (Math.floor(n / 100000) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M';
  }
  const plural = (n, one, many) => (Math.round(n) === 1 ? one : many);

  function stepsFor(id) { return id === '7E' ? S.s7E.steps : id === '7G' ? S.s7G.steps : id === '29' ? S.s29.steps : [S.s38.followers]; }
  function curFollowers(id) {
    const steps = stepsFor(id);
    const i = Math.max(0, Math.min(steps.length - 1, R.step[id] || 0));
    return steps[i] ?? 0;
  }

  let extraGrid = [];   // fotos agregadas desde la galería (URLs de blobs)
  async function loadExtraGrid() {
    const keys = store.get('guita.micaExtra', []);
    const out = [];
    for (const k of keys) { const u = await blobURL(k); if (u) out.push({ src: u, icon: null }); }
    extraGrid = out;
  }

  function profileModel(id) {
    if (id === '7E' || id === '7G') {
      const c = id === '7E' ? S.s7E : S.s7G;
      const a = S.account;
      const posts = +c.posts || 0;
      return {
        own: true, username: a.username, fullName: a.fullName, bio: c.showBio ? a.bio : '', link: '',
        avatar: img('avatar'), navAvatar: img('avatar'), posts, following: c.following,
        grid: Array.from({ length: posts }, () => ({ src: img('post'), icon: null })),
        highlights: [], ring: false
      };
    }
    const m = S.mica;
    const grid = MICA_GRID.slice(0, 3).concat(extraGrid, MICA_GRID.slice(3));
    return {
      own: id === '38', username: m.username, fullName: m.fullName, bio: m.bio, link: m.link,
      avatar: img('micaAvatar'), navAvatar: id === '38' ? img('micaAvatar') : img('mlAvatar'),
      posts: m.posts, following: m.following, grid, more: true,
      highlights: m.highlights.map((l, i) => ({ label: l, src: MICA_HL[i % MICA_HL.length] })),
      ring: id === '29', mutuals: id === '29' ? m.mutuals : ''
    };
  }

  function renderProfile(id) {
    applyChrome({ tone: 'auto' });
    const p = profileModel(id);
    const f = curFollowers(id);
    const ptr = S.platform === 'ios'
      ? `<svg class="ios-spin" viewBox="0 0 24 24">${spinnerLines('var(--muted)')}</svg>`
      : `<span class="and-spin"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg></span>`;
    const badge = (ic) => ic === 'reel' ? I.reelBadge : ic === 'pin' ? I.pinBadge : ic === 'carousel' ? I.carouselBadge : '';
    const grid = p.grid.length
      ? `<div class="p-grid">${p.grid.map((g) => `<div style="background-image:url('${g.src}')">${g.icon ? `<i class="p-badge">${badge(g.icon)}</i>` : ''}</div>`).join('')}</div>${p.more ? `<div class="p-more"><svg class="spin-dots" viewBox="0 0 24 24">${spinnerLines('var(--muted)')}</svg></div>` : ''}`
      : `<div class="p-empty"><i>${I.camera}</i><h3>Compartí fotos y videos</h3><p>Cuando compartas fotos y videos, aparecerán en tu perfil.</p><a>Compartí tu primera foto</a></div>`;
    const hls = (p.own ? `<div><i>${I.plus}</i>Nuevo</div>` : '') + p.highlights.map((h) => `<div><i class="ph" style="background-image:url('${h.src}')"></i>${esc(h.label)}</div>`).join('');
    const top = p.own
      ? `<div class="p-top"><div class="p-user">${esc(p.username)}${I.chev}</div><div class="p-actions"><span data-act="${id === '38' ? 'mica-plus' : ''}">${I.add}</span><span>${I.menu}</span></div></div>`
      : `<div class="p-top other"><div class="p-user"><span class="p-back">${S.platform === 'ios' ? I.backIOS : I.backAnd}</span>${esc(p.username)}</div><div class="p-actions"><span>${I.bell}</span><span>${I.dots}</span></div></div>`;
    const btns = p.own
      ? `<div class="p-btns"><span>Editar perfil</span><span>Compartir perfil</span></div>`
      : `<div class="p-btns"><span>Siguiendo <em>${I.chev}</em></span><span>Mensaje</span><span class="sq">${I.personPlus}</span></div>`;

    screen.innerHTML = `
      <div class="ig">
        ${top}
        <div class="p-scroll" id="scroller">
          <div class="ptr" id="ptr">${ptr}</div>
          <div class="p-content" id="ptrContent">
            <section class="p-head">
              <div class="p-avatar ${p.ring ? 'ring' : ''}"><img src="${p.avatar}" alt="">${p.own ? `<span class="plus">${I.plus}</span>` : ''}</div>
              <div class="p-right">
                <div class="p-name">${esc(p.fullName)}</div>
                <div class="p-stats">
                  <div class="p-stat"><b>${fmtNum(p.posts)}</b><span>${plural(p.posts, 'publicación', 'publicaciones')}</span></div>
                  <div class="p-stat"><b data-stat="followers">${fmtNum(f)}</b><span data-stat="followersLabel">${plural(f, 'seguidor', 'seguidores')}</span></div>
                  <div class="p-stat"><b>${fmtNum(p.following)}</b><span>seguidos</span></div>
                </div>
              </div>
            </section>
            ${p.bio ? `<div class="p-bio">${esc(p.bio)}</div>` : ''}
            ${p.link ? `<div class="p-link">${I.link}<span>${esc(p.link)}</span></div>` : ''}
            ${p.mutuals ? `<div class="p-mutual"><span class="stack">${MICA_HL.slice(0, 3).map((s) => `<i style="background-image:url('${s}')"></i>`).join('')}</span><span>${esc(p.mutuals)}</span></div>` : ''}
            ${btns}
            ${hls ? `<div class="p-hl">${hls}</div>` : ''}
            <div class="p-tabs"><span class="on">${I.grid}</span><span>${I.reels}</span><span>${I.tagged}</span></div>
            ${grid}
          </div>
        </div>
        <nav class="p-nav">
          <span>${I.home}</span><span>${I.search}</span><span data-act="${id === '38' ? 'mica-plus' : ''}">${I.add}</span><span>${I.reels}</span>
          <span class="me"><img src="${p.navAvatar}" alt=""></span>
        </nav>
      </div>`;
    if (id !== '38') attachPTR($('#scroller'), $('#ptrContent'), $('#ptr'), () => advance(id, +1));
  }

  function updateFollowers(id) {
    const f = curFollowers(id);
    const b = $('[data-stat="followers"]');
    const l = $('[data-stat="followersLabel"]');
    if (b) b.textContent = fmtNum(f);
    if (l) l.textContent = plural(f, 'seguidor', 'seguidores');
  }

  function advance(id, dir) {
    const steps = stepsFor(id);
    R.step[id] = Math.max(0, Math.min(steps.length - 1, (R.step[id] || 0) + dir));
    saveRuntime();
    updateFollowers(id);
    if (!sheetWrap.hidden) renderSheet();
  }

  function attachPTR(scroller, content, ptr, onRefresh) {
    const TH = 64;
    let startY = null, dy = 0, pulling = false, busy = false;
    const setPos = (y, anim) => {
      content.style.transition = anim ? 'transform .3s cubic-bezier(.2,.8,.2,1)' : 'none';
      content.style.transform = y ? `translateY(${y}px)` : '';
      const p = Math.min(1, y / TH);
      ptr.style.opacity = busy ? 1 : p;
      if (!busy) ptr.firstElementChild.style.transform = `rotate(${Math.round(p * 8) * 45}deg)`;
    };
    const rubber = (d) => Math.min(150, d < 90 ? d * 0.75 : 67.5 + (d - 90) * 0.35);
    const begin = (y) => { if (busy) return; startY = scroller.scrollTop <= 0 ? y : null; dy = 0; pulling = false; };
    const move = (y, ev) => {
      if (startY == null || busy) return;
      const d = y - startY;
      if (d > 0 && scroller.scrollTop <= 0) { pulling = true; if (ev.cancelable) ev.preventDefault(); dy = rubber(d); setPos(dy, false); }
      else if (pulling) { dy = 0; setPos(0, false); }
    };
    const end = () => {
      if (startY == null) return;
      startY = null;
      if (!pulling) return;
      pulling = false;
      if (dy >= TH) refresh(); else setPos(0, true);
    };
    const refresh = () => {
      busy = true; ptr.classList.add('busy'); ptr.firstElementChild.style.transform = '';
      setPos(56, true);
      later(() => { onRefresh(); busy = false; ptr.classList.remove('busy'); setPos(0, true); }, S.refreshMs);
    };
    scroller.addEventListener('touchstart', (e) => begin(e.touches[0].clientY), { passive: true });
    scroller.addEventListener('touchmove', (e) => move(e.touches[0].clientY, e), { passive: false });
    scroller.addEventListener('touchend', end);
    scroller.addEventListener('touchcancel', end);
    scroller.addEventListener('mousedown', (e) => { begin(e.clientY); const mm = (ev) => move(ev.clientY, ev); const mu = () => { end(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); }; window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu); });
  }

  /* =======================================================================
     Pantallas bloqueadas con notificaciones (9H, 21, 39)
     ======================================================================= */
  const LOCK = {
    '9H': { cfg: () => S.s9H, start: () => 'off', stream: true,
      armTitle: 'Lluvia de notificaciones' },
    '21': { cfg: () => S.s21, start: () => S.s21.start, stream: false,
      armTitle: 'Micar publicó un video', notif: () => ({ title: esc(S.appName), body: esc(fillU(S.s21.text)), tap: true }) },
    '39': { cfg: () => S.s39, start: () => S.s39.start, stream: false,
      armTitle: 'Notificación del vivo', notif: () => ({ title: esc(S.appName), body: esc(fillU(S.s39.text)) }) }
  };
  let nIdx = 0, nInterval = 1.6, vibTimer = null, notifTimer = null;

  function renderLockScene(id) {
    if (id === '21' && R.sub['21'] === 'reel') return renderReel('21');
    const L = LOCK[id];
    const c = L.cfg();
    const st = R.sub[id] || 'arm';
    if (st === 'arm') {
      applyChrome({ tone: 'light', hidden: true, crew: true });
      const trig = { timer: `Arranca sola a los ${c.delay} s`, tap: 'Arranca al tocar la pantalla', both: `Arranca a los ${c.delay} s o antes si se toca la pantalla` }[c.trigger];
      const startTxt = L.start() === 'off' ? 'La pantalla queda negra (parece apagada)' : 'Queda la pantalla bloqueada encendida';
      const extra = id === '9H'
        ? `Notificaciones cada ${c.interval} s${c.accelerate ? ', cada vez más rápido' : ''}.`
        : id === '21' ? 'Al tocar la notificación se abre el reel.' : '';
      screen.innerHTML = `
        <div class="crew">
          <div class="kicker">Escena ${id}</div>
          <h1>${esc(L.armTitle)}</h1>
          <p class="sub">${startTxt}. ${trig}. ${extra}</p>
          <button class="crew-btn big" data-act="arm">ARMAR</button>
          <div class="howto">
            <h3>Antes de grabar</h3>
            <ul>
              <li>Brillo del celular al máximo y en modo “No molestar” para que no entren notificaciones reales.</li>
              ${id === '9H' ? `<li>Vibración: <b>${canVibrate ? (c.vibrate === 'off' ? 'apagada (cambiar en el menú oculto)' : c.vibrate === 'continuous' ? 'continua' : 'una por notificación') : 'este celular no permite vibrar desde una web (iPhone). Usar Android.'}</b></li>` : ''}
              ${id === '9H' && canVibrate ? '<li>En Ajustes del sistema → Sonido y vibración → subir la <b>intensidad de vibración</b> al máximo.</li>' : ''}
              <li>Para cortar o repetir: mantener apretada la esquina superior izquierda.</li>
            </ul>
          </div>
          <a class="crew-btn ghost" href="#menu" style="display:grid;place-items:center;text-decoration:none">Volver a escenas</a>
        </div>`;
      return;
    }
    const showBlack = st === 'idle' && L.start() === 'off';
    if (showBlack) {
      applyChrome({ tone: 'light', hidden: true });
      screen.innerHTML = '<div class="off" id="off"></div>';
    } else {
      applyChrome({ tone: 'light', lock: true, overlay: fakeSBVisible() });
      const wall = img('wallpaper');
      screen.innerHTML = `
        <div class="lock ${wall ? '' : 'default-wall'}" ${wall ? `style="background-image:url('${wall}')"` : ''} id="lockRoot">
          <div class="lk-head">
            <div class="lk-padlock">${I.padlock}</div>
            <div class="lk-date">${esc(cap(dateStr()))}</div>
            <div class="lk-time">${timeStr()}</div>
          </div>
          <div class="lk-list" id="lkList"></div>
          <div class="lk-bottom">${S.platform === 'ios' ? `<i>${I.torch}</i><i>${I.cam}</i>` : `<i>${I.finger}</i>`}</div>
        </div>`;
    }
    if (st === 'idle') {
      const root = showBlack ? $('#off') : $('#lockRoot');
      if (c.trigger !== 'timer') root.addEventListener('click', () => { if (!suppressClick) fireLock(id); });
      if (c.trigger !== 'tap') later(() => fireLock(id), Math.max(0, +c.delay) * 1000);
    }
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function armLock(id) {
    goImmersive();
    if (canVibrate) { try { navigator.vibrate(1); } catch (e) { /* nada */ } }
    R.sub[id] = 'idle';
    render();
  }

  function fireLock(id) {
    if (route !== id || R.sub[id] === 'on') return;
    clearTimers();
    const wasBlack = !$('#lkList');
    R.sub[id] = 'on';
    if (wasBlack) render();
    const L = LOCK[id];
    if (L.stream) {
      nIdx = 0;
      nInterval = Math.max(0.2, +S.s9H.interval || 1.6);
      startVibration();
      notifTimer = setTimeout(tickNotif, 450);
    } else {
      later(() => {
        const list = $('#lkList'); if (!list) return;
        const n = L.notif();
        const el = pushNotif(list, n);
        if (n.tap) el.addEventListener('click', (e) => { e.stopPropagation(); if (suppressClick) return; R.sub['21'] = 'reel'; render(); });
        if (canVibrate) { try { navigator.vibrate([220, 90, 220]); } catch (e) { /* nada */ } }
      }, wasBlack ? 350 : 60);
    }
  }

  function tickNotif() {
    const list = $('#lkList');
    if (!list || R.sub['9H'] !== 'on' || route !== '9H') return;
    pushNotif(list, notifFrom(NOTIFS[nIdx % NOTIFS.length]));
    nIdx++;
    if (S.s9H.vibrate === 'each' && canVibrate) { try { navigator.vibrate(350); } catch (e) { /* nada */ } }
    if (S.s9H.accelerate) nInterval = Math.max(+S.s9H.minInterval || 0.35, nInterval * 0.88);
    notifTimer = setTimeout(tickNotif, nInterval * 1000);
  }

  function notifFrom(n) {
    const app = esc(S.appName);
    if (n.type === 'dm') return { title: esc(n.user), body: esc(n.text), dm: true };
    if (n.type === 'follow') return { title: app, body: `<b>${esc(n.user)}</b> comenzó a seguirte.` };
    return { title: app, body: `A <b>${esc(n.user)}</b> y ${n.others} personas más les gustó tu publicación.` };
  }

  function pushNotif(list, t) {
    const el = document.createElement('div');
    if (S.platform === 'ios') {
      el.className = 'nt nt-ios';
      el.innerHTML = `${appIcon('md')}<div class="nt-main"><div class="nt-row"><span class="nt-title">${t.title}</span><span class="nt-time">ahora</span></div><div class="nt-text">${t.body}</div></div>`;
    } else {
      el.className = 'nt nt-and';
      el.innerHTML = `<div class="nt-head">${appIcon('sm')}<span>${esc(S.appName)}</span><span>· ahora</span></div>${t.dm ? `<div class="nt-title">${t.title}</div>` : ''}<div class="nt-text">${t.body}</div>`;
    }
    list.prepend(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    const items = list.children;
    for (let i = 1; i < items.length; i++) {
      const tm = items[i].querySelector('.nt-time, .nt-head span:last-child');
      if (tm && i > 4) tm.textContent = S.platform === 'ios' ? (i > 12 ? 'hace 2 min' : 'hace 1 min') : (i > 12 ? '· 2 min' : '· 1 min');
    }
    while (list.children.length > 30) list.lastElementChild.remove();
    return el;
  }

  function startVibration() {
    stopVibration();
    if (!canVibrate || S.s9H.vibrate !== 'continuous') return;
    const pulse = () => { try { navigator.vibrate(Array.from({ length: 20 }, (_, i) => (i % 2 ? 40 : 460))); } catch (e) { /* nada */ } };
    pulse();
    vibTimer = setInterval(pulse, 9700);
  }
  function stopVibration() {
    const was = !!vibTimer;
    if (vibTimer) clearInterval(vibTimer);
    vibTimer = null;
    if (was && canVibrate) { try { navigator.vibrate(0); } catch (e) { /* nada */ } }
  }
  function stopFeed() {
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = null;
    stopVibration();
  }

  /* =======================================================================
     Reels (15, 21)
     ======================================================================= */
  function renderReel(id) {
    applyChrome({ tone: 'light', overlay: fakeSBVisible(), dark: true });
    const c = id === '15' ? S.s15 : S.s21;
    const slot = id === '15' ? 'reel15' : 'reel21';
    screen.innerHTML = `
      <div class="reel">
        <video id="reelVid" playsinline muted loop autoplay preload="auto"></video>
        <div class="rl-shade"></div>
        <div class="rl-top"><b>Reels</b>${I.chev}<span class="rl-cam">${I.cam}</span></div>
        <div class="rl-rail">
          <span>${I.heart}<em>${esc(c.likes)}</em></span>
          <span>${I.bubble}<em>${esc(c.comments)}</em></span>
          <span>${I.repost}<em>${esc(c.shares)}</em></span>
          <span>${I.send}</span>
          <span>${I.dotsV}</span>
          <span class="rl-disc" style="background-image:url('${img('micaAvatar')}')"></span>
        </div>
        <div class="rl-info">
          <div class="rl-user"><img src="${img('micaAvatar')}" alt=""><b>${esc(S.mica.username)}</b><span class="rl-follow">Seguir</span></div>
          <div class="rl-cap">${esc(c.caption)} <span>… más</span></div>
          <div class="rl-audio">${I.music}<span>${esc(S.mica.username)} · Audio original</span></div>
        </div>
        <div class="rl-heart" id="rlHeart">${I.heart}</div>
        <nav class="p-nav dark">
          <span>${I.home}</span><span>${I.search}</span><span>${I.add}</span><span class="on">${I.reels}</span>
          <span class="me"><img src="${img('viewerAvatar')}" alt=""></span>
        </nav>
      </div>`;
    const v = $('#reelVid');
    blobURL('video.' + slot).then((u) => {
      if (!v.isConnected) return;
      v.src = u || VIDEO_DEFAULT[slot];
      v.play().catch(() => { /* se reproduce al primer toque */ });
    });
    let lastTap = 0;
    $('.reel').addEventListener('click', (e) => {
      if (suppressClick) return;
      if (v.paused) v.play().catch(() => {});
      const now = Date.now();
      if (now - lastTap < 320) {
        const h = $('#rlHeart'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
        const lk = $('.rl-rail span'); if (lk) lk.classList.add('liked');
      }
      lastTap = now;
    });
  }

  /* =======================================================================
     Cámara y vivo (38, 40)
     ======================================================================= */
  let camStream = null, camErr = null, camPending = null;
  function ensureCam() {
    if (camStream && camStream.active) return Promise.resolve(camStream);
    if (camPending) return camPending;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camErr = { name: 'NoDisponible' }; return Promise.resolve(null); }
    camPending = navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => { camStream = s; camErr = null; return s; })
      .catch((e) => { camErr = e; camStream = null; return null; })
      .finally(() => { camPending = null; });
    return camPending;
  }
  function stopCam() { if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; } }
  function attachCam(v) {
    ensureCam().then((s) => {
      if (!v.isConnected) return;
      if (s) { v.srcObject = s; v.play().catch(() => {}); }
      else {
        v.classList.add('nomirror'); v.loop = true; v.src = VIDEO_DEFAULT.reel21; v.play().catch(() => {});
        toast('Sin acceso a la cámara' + (camErr && camErr.name ? ` (${camErr.name})` : '') + '. Revisá los permisos.');
      }
    });
  }

  function render38() {
    const sub = R.sub['38'] || 'profile';
    if (sub === 'profile') {
      renderProfile('38');
      if (S.s38.askCameraOnEnter) ensureCam();
      return;
    }
    if (sub === 'camera') return renderCamera();
    return renderLive('38');
  }

  const MODES = ['PUBLICACIÓN', 'HISTORIA', 'REEL', 'EN VIVO'];
  let camMode = 1;
  function renderCamera() {
    applyChrome({ tone: 'light', overlay: fakeSBVisible(), dark: true });
    screen.innerHTML = `
      <div class="cam" id="camRoot">
        <video id="camVid" class="mirror" playsinline muted autoplay></video>
        <div class="cam-top"><span data-sub="38:profile">${I.close}</span><span>${I.flash}</span><span>${I.gear}</span></div>
        <div class="cam-side" id="camSide"></div>
        <div class="cam-bottom">
          <div class="cam-row">
            <span class="cam-gal" style="background-image:url('${MICA_GRID[1].src}')"></span>
            <button type="button" class="cam-shutter" id="shutter"><i></i></button>
            <span class="cam-flip">${I.flip}</span>
          </div>
          <div class="cam-modes"><div class="cam-modes-in" id="modes">${MODES.map((m, i) => `<span data-mode="${i}">${m}</span>`).join('')}</div></div>
        </div>
        <div class="cam-connect" id="camConnect" hidden><svg class="spin-dots" viewBox="0 0 24 24">${spinnerLines('#fff')}</svg><span>Iniciando video en vivo…</span></div>
      </div>`;
    attachCam($('#camVid'));
    setMode(camMode, false);
    $('#modes').addEventListener('click', (e) => { const m = e.target.closest('[data-mode]'); if (m) setMode(+m.dataset.mode, true); });
    // deslizar para cambiar de modo
    let sx = null;
    const root = $('#camRoot');
    root.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    root.addEventListener('pointerup', (e) => {
      if (sx == null) return; const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) setMode(Math.max(0, Math.min(MODES.length - 1, camMode + (dx < 0 ? 1 : -1))), true);
    });
    $('#shutter').addEventListener('click', () => {
      if (camMode !== 3) { const s = $('#shutter'); s.classList.remove('tap'); void s.offsetWidth; s.classList.add('tap'); return; }
      const cc = $('#camConnect'); cc.hidden = false;
      later(() => { R.sub['38'] = 'live'; render(); }, 1400);
    });
  }
  function setMode(i, anim) {
    camMode = i;
    const box = $('#modes'); if (!box) return;
    const items = box.children;
    for (let k = 0; k < items.length; k++) items[k].classList.toggle('on', k === i);
    const el = items[i];
    const center = el.offsetLeft + el.offsetWidth / 2;
    box.style.transition = anim ? 'transform .25s ease' : 'none';
    box.style.transform = `translateX(${-center}px)`;
    const live = i === 3;
    $('#camRoot').classList.toggle('is-live', live);
    $('#shutter').innerHTML = live ? `<i>${I.live}</i>` : '<i></i>';
    $('#camSide').innerHTML = live
      ? `<span>${I.title}<em>Título</em></span><span>${I.people}<em>Público</em></span><span>${I.clock}<em>Programar</em></span>`
      : `<span><b>Aa</b></span><span>${I.flip}</span>`;
  }

  /* ---------- Vivo ---------- */
  const LV = { t0: 0, phase: 1, viewers: 0, muted: false, p3t0: 0, p3v0: 0, used: { 1: 0, 2: 0, 3: 0 }, loops: [] };
  function stopLive() { LV.loops.forEach(clearTimeout); LV.loops = []; LV.running = false; }
  const loop = (fn, ms) => { const t = setTimeout(fn, ms); LV.loops.push(t); if (LV.loops.length > 50) LV.loops.splice(0, 25); };

  function renderLive(id) {
    applyChrome({ tone: 'light', overlay: fakeSBVisible(), dark: true });
    screen.innerHTML = `
      <div class="lv">
        <video id="lvVid" class="mirror" playsinline muted autoplay></video>
        <div class="lv-shade"></div>
        <div class="lv-top">
          <span class="lv-badge">EN VIVO</span>
          <span class="lv-count">${I.eye}<b id="lvCount">${fmtNum(S.s40.viewersStart)}</b></span>
          <span class="lv-mutechip" id="lvMuteChip" hidden>${I.micOff}</span>
          <span class="lv-x">${I.close}</span>
        </div>
        <div class="lv-list" id="lvList"></div>
        <div class="lv-hearts" id="lvHearts"></div>
        <div class="lv-bar">
          <span class="lv-input">Comentar…</span>
          <span class="lv-ic">${I.question}</span>
          <span class="lv-ic">${I.personPlus}</span>
          <span class="lv-ic" id="lvMic">${I.mic}</span>
          <span class="lv-ic">${I.send}</span>
        </div>
      </div>`;
    attachCam($('#lvVid'));
    $('#lvMic').addEventListener('click', (e) => { e.stopPropagation(); setMute(!LV.muted); });
    startLive();
  }

  function setMute(m) {
    LV.muted = m;
    const b = $('#lvMic'); if (b) { b.innerHTML = m ? I.micOff : I.mic; b.classList.toggle('is-muted', m); }
    const c = $('#lvMuteChip'); if (c) c.hidden = !m;
  }

  function startLive() {
    stopLive();
    const c = S.s40;
    LV.running = true; LV.t0 = performance.now(); LV.phase = 1; LV.viewers = +c.viewersStart || 0; LV.used = { 1: 0, 2: 0, 3: 0 };
    setMute(!!c.startMuted);
    viewersTick();
    loop(commentTick, 700);
    loop(heartTick, 900);
    if (+c.phase2At > 0) loop(() => setPhase(2), c.phase2At * 1000);
    if (+c.phase3At > 0) loop(() => setPhase(3), c.phase3At * 1000);
  }

  function setPhase(p) {
    if (!LV.running) return;
    if (p === 3) {
      LV.p3t0 = performance.now(); LV.p3v0 = LV.viewers;
      LV.phase = 0; // el chat se detiene un segundo
      setTimeout(() => { if (LV.running) { LV.phase = 3; burstHearts(16); } }, 1100);
    } else LV.phase = p;
    if (!sheetWrap.hidden) renderSheet();
  }

  function viewersTarget() {
    const c = S.s40;
    const t = (performance.now() - LV.t0) / 1000;
    const a = +c.viewersStart || 0, b = +c.viewersTarget || 0, T = Math.max(0.5, +c.rampSec || 10);
    if (LV.p3t0 && (LV.phase === 3 || LV.phase === 0)) {
      const t3 = (performance.now() - LV.p3t0) / 1000;
      const r = Math.min(1, t3 / 14);
      const e = (1 - Math.cos(Math.PI * r)) / 2;
      return LV.p3v0 + ((+c.viewersPhase3 || b) - LV.p3v0) * e + (r >= 1 ? (t3 - 14) * 6 : 0);
    }
    if (t < T) { const r = t / T; const e = r * r * (3 - 2 * r); return a + (b - a) * (0.15 * r + 0.85 * e); }
    return b * (1 + 0.0025 * (t - T)) ;
  }
  function viewersTick() {
    if (!LV.running) return;
    const target = viewersTarget();
    let v = target * (1 + (Math.random() - 0.5) * 0.024) + rnd(-3, 3);
    if (v < LV.viewers && Math.random() < 0.75) v = LV.viewers + rnd(0, Math.max(1, target * 0.002));
    LV.viewers = Math.max(0, Math.round(v));
    const el = $('#lvCount'); if (el) el.textContent = fmtNum(LV.viewers);
    loop(viewersTick, rnd(140, 420));
  }

  function nextComment() {
    const pool = LIVE_TXT['phase' + LV.phase] || LIVE_TXT.phase1;
    const scripted = { 1: 5, 2: 8, 3: 11 }[LV.phase] || 0;
    let text;
    if (LV.used[LV.phase] < scripted) text = pool[LV.used[LV.phase]++];
    else text = pick(pool);
    return { user: pick(LIVE_TXT.users), text };
  }
  const AV_COLORS = ['#FFBA77', '#FC8565', '#CD6653', '#9B4D40', '#616F3A', '#9AB25A', '#CD9061', '#FEDA8E'];
  function commentTick() {
    if (!LV.running) return;
    const list = $('#lvList'); if (!list) return;
    if (LV.phase !== 0) {
      const join = LV.phase === 1 && Math.random() < 0.18;
      const c = nextComment();
      const el = document.createElement('div');
      el.className = 'lv-c' + (join ? ' join' : '');
      const col = AV_COLORS[c.user.length % AV_COLORS.length];
      el.innerHTML = join
        ? `<i style="background:${col}">${esc(c.user[0].toUpperCase())}</i><span><b>${esc(c.user)}</b> se unió</span>`
        : `<i style="background:${col}">${esc(c.user[0].toUpperCase())}</i><span><b>${esc(c.user)}</b>${esc(c.text)}</span>`;
      list.appendChild(el);
      requestAnimationFrame(() => el.classList.add('in'));
      while (list.children.length > 24) list.firstElementChild.remove();
    }
    const t = (performance.now() - LV.t0) / 1000;
    const speed = Math.min(1, t / Math.max(1, +S.s40.rampSec || 10));
    const ms = LV.phase === 1 ? rnd(450, 1300) * (1 - 0.45 * speed) : LV.phase === 2 ? rnd(260, 750) : LV.phase === 3 ? rnd(180, 520) : 300;
    loop(commentTick, ms);
  }
  function spawnHeart() {
    const box = $('#lvHearts'); if (!box) return;
    const h = document.createElement('i');
    h.innerHTML = I.heart;
    h.style.color = pick(['#ff4d6d', '#FC8565', '#FFBA77', '#ff7aa2', '#ffffff']);
    h.style.setProperty('--dx', `${Math.round(rnd(-38, 18))}px`);
    h.style.setProperty('--dur', `${rnd(1.8, 2.8).toFixed(2)}s`);
    box.appendChild(h);
    setTimeout(() => h.remove(), 3000);
  }
  function burstHearts(n) { for (let i = 0; i < n; i++) setTimeout(spawnHeart, i * 70); }
  function heartTick() {
    if (!LV.running) return;
    if (LV.phase === 1 || LV.phase === 3) spawnHeart();
    else if (LV.phase === 2 && Math.random() < 0.15) spawnHeart();
    loop(heartTick, LV.phase === 3 ? rnd(120, 300) : LV.phase === 1 ? rnd(500, 1400) : rnd(1200, 2600));
  }

  /* =======================================================================
     Pantalla completa + pantalla siempre encendida
     ======================================================================= */
  let wakeLock = null;
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { /* nada */ }
  }
  async function goImmersive() {
    keepAwake();
    if (S.autoFullscreen && isTouch && !isIOSDevice && !isStandalone() && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { /* nada */ }
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && route !== 'menu') keepAwake(); });
  document.addEventListener('fullscreenchange', () => applyChrome());

  /* =======================================================================
     Gestos ocultos
     ======================================================================= */
  let lpTimer = null, lpStart = null, suppressClick = false, lastCornerTap = 0;
  const local = (e) => { const r = phone.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; };

  phone.addEventListener('pointerdown', (e) => {
    if (route !== 'menu') goImmersive();
    if (!sheetWrap.hidden) return;
    const p = local(e);
    if (p.x < 76 && p.y < 76) {
      lpStart = p;
      lpTimer = setTimeout(() => { lpTimer = null; suppressClick = true; setTimeout(() => { suppressClick = false; }, 600); openSheet(); }, 900);
    }
    if (['7E', '7G', '29'].includes(route) && p.x > p.w - 84 && p.y > p.h - 96) {
      const now = Date.now();
      if (now - lastCornerTap < 380) { lastCornerTap = 0; if ($('[data-stat="followers"]')) advance(route, +1); }
      else lastCornerTap = now;
    }
  }, true);
  const cancelLP = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
  phone.addEventListener('pointerup', cancelLP, true);
  phone.addEventListener('pointercancel', cancelLP, true);
  phone.addEventListener('pointermove', (e) => { if (!lpTimer || !lpStart) return; const p = local(e); if (Math.abs(p.x - lpStart.x) > 14 || Math.abs(p.y - lpStart.y) > 14) cancelLP(); }, true);
  phone.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  phone.addEventListener('contextmenu', (e) => e.preventDefault());

  screen.addEventListener('click', (e) => {
    const g = e.target.closest('[data-sub]');
    if (g) { const [sc, sub] = g.dataset.sub.split(':'); R.sub[sc] = sub; saveRuntime(); render(); return; }
    const a = e.target.closest('[data-act]');
    if (a && a.dataset.act) act(a.dataset.act, a);
  });

  /* =======================================================================
     Menú oculto
     ======================================================================= */
  function openSheet() { sheetWrap.hidden = false; renderSheet(); }
  function closeSheet() { sheetWrap.hidden = true; resetConfirm = false; }
  $('#sheetBackdrop').addEventListener('click', closeSheet);

  const getPath = (p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
  function setPath(p, v) {
    const ks = p.split('.'); let o = S;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = v;
  }
  const seg = (path, opts) => `<div class="seg">${opts.map(([v, l]) => `<button type="button" data-set="${path}" data-val='${JSON.stringify(v)}' class="${getPath(path) === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const row = (label, ctrl, note) => `<div class="sh-row"><span>${label}${note ? `<small>${note}</small>` : ''}</span>${ctrl}</div>`;
  const txt = (path, type = 'text', attrs = '') => `<input type="${type}" data-path="${path}" data-type="${type}" value="${esc(getPath(path))}" ${attrs}>`;
  const stepsInput = (path) => `<input type="text" data-path="${path}" data-type="steps" value="${esc(getPath(path).join(', '))}" inputmode="numeric">`;
  const thumb = (k) => { const u = img(k); return u ? `<span class="thumb" style="background-image:url('${u}')"></span>` : '<span class="thumb"></span>'; };
  const imgRow = (label, k) => row(label, `<span style="display:flex;gap:8px;align-items:center">${thumb(k)}<div class="seg"><button type="button" data-act="pick" data-key="${k}">Cambiar</button><button type="button" data-act="unpick" data-key="${k}">Original</button></div></span>`);
  const vidRow = (label, slot) => row(label, `<div class="seg"><button type="button" data-act="pickvid" data-key="${slot}">Cargar video</button><button type="button" data-act="unpickvid" data-key="${slot}">Provisorio</button></div>`, store.get('guita.vidname.' + slot, '') ? esc(store.get('guita.vidname.' + slot, '')) : 'Usa el video provisorio');
  const trigRow = (k) => row('Arranque', seg(`${k}.trigger`, [['timer', 'Temporizador'], ['tap', 'Toque'], ['both', 'Ambos']])) + row('Temporizador (seg)', txt(`${k}.delay`, 'number', 'min="0" step="1"'));
  let resetConfirm = false;

  function sceneSheet() {
    const r = route;
    if (r === '7E' || r === '7G' || r === '29') {
      const k = 's' + r;
      const steps = stepsFor(r);
      const i = R.step[r] || 0;
      return `
        <div class="sh-sec">Escena ${r}</div>
        <div class="sh-card">
          <div class="sh-big-num">${fmtNum(curFollowers(r))}<small>seguidores · paso ${i + 1} de ${steps.length}</small></div>
          <div class="sh-btns"><button type="button" data-act="prev">◀ Anterior</button><button type="button" data-act="next">Siguiente ▶</button></div>
          ${r === '7E' ? `<div class="sh-btns"><button type="button" data-act="go-welcome">Ir a bienvenida</button><button type="button" data-act="go-form">Ir a formulario</button></div>` : ''}
          <button type="button" class="sh-wide hot" data-act="reset-scene">Reiniciar escena</button>
          ${r === '7E' ? row('La escena arranca en', seg('s7E.start', [['welcome', 'Bienvenida'], ['form', 'Formulario'], ['profile', 'Perfil']])) : ''}
          ${r === '7E' ? row('Campos del formulario', seg('s7E.fieldMode', [['magic', 'Mágico'], ['filled', 'Llenos'], ['free', 'Libre']]), 'Mágico: cualquier tecla escribe el texto correcto') : ''}
          ${row('Seguidores por refresh', stepsInput(`${k}.steps`), 'Separados por coma')}
          ${r !== '29' ? row('Publicaciones', txt(`${k}.posts`, 'number', 'min="0" max="9"')) + row('Seguidos', txt(`${k}.following`, 'number', 'min="0"')) + row('Mostrar biografía', seg(`${k}.showBio`, [[true, 'Sí'], [false, 'No']])) : ''}
        </div>`;
    }
    if (r === '9H' || r === '21' || r === '39') {
      const k = 's' + r;
      return `
        <div class="sh-sec">Escena ${r}</div>
        <div class="sh-card">
          <div class="sh-btns"><button type="button" class="hot" data-act="fire">Disparar ya</button><button type="button" data-act="stoplock">Detener</button></div>
          <div class="sh-btns"><button type="button" data-act="idlelock">Volver al inicio</button><button type="button" data-act="rearm">Volver a armar</button></div>
          ${r !== '9H' ? row('Pantalla al inicio', seg(`${k}.start`, [['lock', 'Bloqueada'], ['off', 'Apagada']])) : ''}
          ${trigRow(k)}
          ${r === '9H' ? row('Intervalo inicial (seg)', txt('s9H.interval', 'number', 'min="0.2" step="0.1"')) + row('Acelerar', seg('s9H.accelerate', [[true, 'Sí'], [false, 'No']])) + row('Vibración', seg('s9H.vibrate', [['continuous', 'Continua'], ['each', 'Por notif.'], ['off', 'No']]), canVibrate ? '' : 'Este celular no permite vibrar desde la app') : ''}
          ${r !== '9H' ? row('Texto', txt(`${k}.text`), '{u} = usuario de Mica') : ''}
          ${r === '21' ? vidRow('Video del reel', 'reel21') : ''}
        </div>`;
    }
    if (r === '15') {
      return `
        <div class="sh-sec">Escena 15</div>
        <div class="sh-card">
          ${vidRow('Video del reel', 'reel15')}
          ${row('Texto', txt('s15.caption'))}
          ${row('Me gusta', txt('s15.likes'))}
          ${row('Comentarios', txt('s15.comments'))}
          <button type="button" class="sh-wide hot" data-act="reset-scene">Reiniciar escena</button>
        </div>`;
    }
    if (r === '38' || r === '40') {
      const inLive = r === '40' || R.sub['38'] === 'live';
      return `
        <div class="sh-sec">Escena ${r}${r === '38' ? ` · ${{ profile: 'perfil', camera: 'cámara', live: 'en vivo' }[R.sub['38'] || 'profile']}` : ''}</div>
        <div class="sh-card">
          ${r === '38' ? `<div class="sh-btns"><button type="button" data-act="go38-profile">Perfil</button><button type="button" data-act="go38-camera">Cámara</button></div>` : ''}
          ${inLive ? `<div class="sh-big-num">${fmtNum(LV.viewers)}<small>espectadores · fase ${LV.phase === 0 ? '3' : LV.phase} de comentarios</small></div>
          <div class="sh-btns"><button type="button" data-act="phase1">Fase 1 · llegada</button><button type="button" data-act="phase2">Fase 2 · horror</button></div>
          <div class="sh-btns"><button type="button" data-act="phase3">Fase 3 · apoyo</button><button type="button" data-act="mute">${LV.muted ? 'Activar micrófono' : 'Silenciar micrófono'}</button></div>` : ''}
          <button type="button" class="sh-wide hot" data-act="reset-scene">${r === '38' ? 'Reiniciar escena (vuelve al perfil)' : 'Reiniciar el vivo'}</button>
          <button type="button" class="sh-wide" data-act="askcam">Pedir permiso de cámara ahora</button>
          ${row('Espectadores al inicio', txt('s40.viewersStart', 'number', 'min="0"'))}
          ${row('Espectadores a los X seg', txt('s40.viewersTarget', 'number', 'min="0"'))}
          ${row('Segundos para llegar', txt('s40.rampSec', 'number', 'min="1" step="1"'))}
          ${row('Fase 2 a los (seg)', txt('s40.phase2At', 'number', 'min="0" step="1"'), '0 = sólo a mano')}
          ${row('Fase 3 a los (seg)', txt('s40.phase3At', 'number', 'min="0" step="1"'), '0 = sólo a mano')}
          ${row('Espectadores en fase 3', txt('s40.viewersPhase3', 'number', 'min="0"'))}
          ${row('Arrancar silenciada', seg('s40.startMuted', [[true, 'Sí'], [false, 'No']]))}
          ${r === '38' ? row('Seguidores del perfil', txt('s38.followers', 'number', 'min="0"')) + row('Pedir cámara al entrar', seg('s38.askCameraOnEnter', [[true, 'Sí'], [false, 'No']]), 'Así el permiso no aparece en medio de la toma') : ''}
        </div>`;
    }
    return '';
  }

  function renderSheet() {
    const extras = store.get('guita.micaExtra', []).length;
    const ep3 = ['15', '21', '29', '38', '39', '40'].includes(route);
    const contentLR = `
        ${row('Usuario', txt('account.username'))}
        ${row('Nombre', txt('account.fullName'))}
        ${imgRow('Foto de perfil', 'avatar')}
        ${imgRow('Foto de la publicación', 'post')}`;
    const contentMica = `
        ${row('Usuario de Mica', txt('mica.username'))}
        ${row('Nombre de Mica', txt('mica.fullName'))}
        ${row('Publicaciones', txt('mica.posts', 'number', 'min="0"'))}
        ${row('Seguidos', txt('mica.following', 'number', 'min="0"'))}
        ${imgRow('Foto de perfil de Mica', 'micaAvatar')}
        ${row(`Fotos extra en el perfil de Mica · ${extras}`, `<div class="seg"><button type="button" data-act="addgrid">Agregar</button><button type="button" data-act="cleargrid">Borrar</button></div>`, 'Se agregan desde la galería del celular')}
        ${imgRow('Foto de María Laura (barra de abajo)', 'mlAvatar')}
        ${imgRow('Foto de Ariel (barra de abajo)', 'viewerAvatar')}`;
    sheet.innerHTML = `
      <div class="sh-grip"></div>
      <div class="sh-title"><b>Menú oculto</b><button type="button" data-act="close">Cerrar</button></div>
      ${sceneSheet()}
      <div class="sh-sec">Celular</div>
      <div class="sh-card">
        ${row('Sistema', seg('platform', [['ios', 'iPhone'], ['android', 'Android']]))}
        ${row('Tema de la app', seg('theme', [['light', 'Claro'], ['dark', 'Oscuro']]))}
        ${row('Barra de estado falsa', seg('statusBar', [['auto', 'Auto'], ['on', 'Sí'], ['off', 'No']]), isIOSDevice ? 'En iPhone se ve la barra real del celular' : '')}
        ${row('Hora', seg('clockMode', [['real', 'Real'], ['fixed', 'Fija']]))}
        ${S.clockMode === 'fixed' ? row('Hora fija', txt('clockFixed', 'time')) : ''}
        ${row('Fecha (pantalla bloqueada)', seg('dateMode', [['real', 'Real'], ['fixed', 'Fija']]))}
        ${S.dateMode === 'fixed' ? row('Fecha fija', txt('dateFixed', 'date')) : ''}
        ${row(`Batería · ${Math.round(S.battery)}%`, `<input type="range" min="1" max="100" data-path="battery" data-type="range" value="${S.battery}">`)}
        ${row('Cargando', seg('charging', [[true, 'Sí'], [false, 'No']]))}
        ${row('Operadora', txt('carrier'))}
        ${row('Señal', seg('signal', [[1, '1'], [2, '2'], [3, '3'], [4, '4']]))}
        ${row('Wi-Fi', seg('wifi', [[true, 'Sí'], [false, 'No']]))}
        ${imgRow('Fondo pantalla bloqueada', 'wallpaper')}
      </div>
      <div class="sh-sec">Contenidos</div>
      <div class="sh-card">
        ${row('Nombre de la app', txt('appName'))}
        ${ep3 ? contentMica + contentLR : contentLR + contentMica}
      </div>
      <div class="sh-sec">Al abrir la app</div>
      <div class="sh-card">
        ${row('Abrir directo en', `<select data-path="launchScene" data-type="select">${ROUTES.map((r) => `<option value="${r}" ${S.launchScene === r ? 'selected' : ''}>${r === 'menu' ? 'Menú de escenas' : 'Escena ' + r}</option>`).join('')}</select>`, 'Cerrá la app del todo y volvé a abrirla desde el ícono')}
      </div>
      <button type="button" class="sh-wide" data-act="fullscreen">Pantalla completa</button>
      <button type="button" class="sh-wide" data-act="menu">Ir al menú de escenas</button>
      <button type="button" class="sh-wide" data-act="reset-all">${resetConfirm ? 'Tocá de nuevo para borrar todos los ajustes' : 'Restablecer todos los ajustes'}</button>
      <p class="sh-note">Los ajustes quedan guardados en este celular. Cada celular se configura por separado.</p>`;
  }

  sheet.addEventListener('click', (e) => {
    const s = e.target.closest('[data-set]');
    if (s) { setPath(s.dataset.set, JSON.parse(s.dataset.val)); afterChange(); return; }
    const a = e.target.closest('[data-act]');
    if (a) act(a.dataset.act, a);
  });
  sheet.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-path]');
    if (!inp) return;
    const t = inp.dataset.type;
    let v = inp.value;
    if (t === 'number' || t === 'range') v = Math.max(0, parseFloat(String(v).replace(',', '.')) || 0);
    if (t === 'steps') { v = v.split(/[,;\s]+/).map((x) => parseInt(x.replace(/\./g, ''), 10)).filter((x) => !isNaN(x)); if (!v.length) v = [0]; }
    if (inp.dataset.path === 'appName' && !String(v).trim()) v = D.appName;
    setPath(inp.dataset.path, v);
    afterChange();
  });
  sheet.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-type="range"]');
    if (!inp) return;
    S.battery = +inp.value; save(); applyChrome();
    const lab = inp.closest('.sh-row').querySelector('span'); if (lab) lab.firstChild.textContent = `Batería · ${S.battery}%`;
  });

  function afterChange() {
    save();
    if (isBusy()) applyChrome();
    else {
      ['7E', '7G', '29'].forEach((id) => { R.step[id] = Math.min(R.step[id] || 0, stepsFor(id).length - 1); });
      render();
    }
    renderSheet();
  }

  function act(name, el) {
    switch (name) {
      case 'open-sheet': openSheet(); break;
      case 'close': closeSheet(); break;
      case 'next': advance(route, +1); break;
      case 'prev': advance(route, -1); break;
      case 'go-welcome': R.sub['7E'] = 'welcome'; saveRuntime(); render(); renderSheet(); break;
      case 'go-form': R.sub['7E'] = 'form'; saveRuntime(); render(); renderSheet(); break;
      case 'mica-plus': R.sub['38'] = 'camera'; camMode = 1; render(); break;
      case 'go38-profile': stopLive(); R.sub['38'] = 'profile'; render(); renderSheet(); break;
      case 'go38-camera': stopLive(); R.sub['38'] = 'camera'; camMode = 1; render(); renderSheet(); break;
      case 'reset-scene':
        R.step[route] = 0;
        if (route === '7E') R.sub['7E'] = S.s7E.start;
        if (route === '38') { stopLive(); R.sub['38'] = 'profile'; camMode = 1; }
        if (route === '21') R.sub['21'] = 'arm';
        saveRuntime(); render(); closeSheet(); toast('Escena reiniciada');
        break;
      case 'arm': armLock(route); break;
      case 'fire': closeSheet(); if (R.sub[route] === 'arm') R.sub[route] = 'idle'; if (R.sub[route] === 'on') { stopFeed(); R.sub[route] = 'idle'; render(); } fireLock(route); break;
      case 'stoplock': stopFeed(); clearTimers(); closeSheet(); toast('Detenido'); break;
      case 'idlelock': stopFeed(); R.sub[route] = 'idle'; closeSheet(); render(); break;
      case 'rearm': stopFeed(); R.sub[route] = 'arm'; closeSheet(); render(); break;
      case 'phase1': LV.p3t0 = 0; setPhase(1); break;
      case 'phase2': LV.p3t0 = 0; setPhase(2); break;
      case 'phase3': setPhase(3); break;
      case 'mute': setMute(!LV.muted); renderSheet(); break;
      case 'askcam': ensureCam().then((s) => toast(s ? 'Cámara lista' : 'Sin permiso de cámara' + (camErr && camErr.name ? ` (${camErr.name})` : ''))); break;
      case 'pick': pickImage(el.dataset.key); break;
      case 'unpick': store.del('guita.img.' + el.dataset.key); render(); renderSheet(); toast('Foto original'); break;
      case 'pickvid': pickVideo(el.dataset.key); break;
      case 'unpickvid': idb.del('video.' + el.dataset.key); forgetBlob('video.' + el.dataset.key); store.del('guita.vidname.' + el.dataset.key); if (!isBusy()) render(); renderSheet(); toast('Video provisorio'); break;
      case 'addgrid': pickGrid(); break;
      case 'cleargrid': {
        const keys = store.get('guita.micaExtra', []);
        keys.forEach((k) => { idb.del(k); forgetBlob(k); });
        store.del('guita.micaExtra'); extraGrid = []; render(); renderSheet(); toast('Fotos extra borradas');
        break;
      }
      case 'fullscreen':
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => toast('Este navegador no permite pantalla completa'));
        else toast('En iPhone: Compartir → “Agregar a inicio” y abrirla desde el ícono');
        break;
      case 'menu': closeSheet(); location.hash = '#menu'; break;
      case 'reset-all':
        if (!resetConfirm) { resetConfirm = true; renderSheet(); break; }
        resetConfirm = false;
        ['guita.settings', 'guita.runtime', 'guita.img.avatar', 'guita.img.post', 'guita.img.wallpaper', 'guita.img.micaAvatar', 'guita.img.mlAvatar', 'guita.img.viewerAvatar'].forEach(store.del);
        S = clone(D); S.platform = isIOSDevice ? 'ios' : 'android';
        R.step = { '7E': 0, '7G': 0, '29': 0 }; R.sub['7E'] = null;
        render(); renderSheet(); toast('Ajustes restablecidos');
        break;
    }
  }

  function readImage(file, max) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c);
      };
      im.onerror = () => { URL.revokeObjectURL(url); res(null); };
      im.src = url;
    });
  }
  function filePicker(accept, multiple, cb) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept; inp.multiple = !!multiple;
    inp.onchange = () => cb(Array.from(inp.files || []));
    inp.click();
  }
  function pickImage(key) {
    filePicker('image/*', false, async ([f]) => {
      if (!f) return;
      const c = await readImage(f, key === 'avatar' || key.endsWith('Avatar') ? 640 : 1440);
      if (!c) { toast('No se pudo abrir esa imagen'); return; }
      if (store.set('guita.img.' + key, c.toDataURL('image/jpeg', 0.86))) toast('Foto guardada'); else toast('No entró en la memoria; probá con una foto más chica');
      if (!isBusy()) render(); renderSheet();
    });
  }
  function pickGrid() {
    filePicker('image/*', true, async (files) => {
      if (!files.length) return;
      const keys = store.get('guita.micaExtra', []);
      let n = 0;
      for (const f of files) {
        const c = await readImage(f, 900);
        if (!c) continue;
        const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.84));
        const k = 'grid.' + Date.now() + '.' + n;
        if (await idb.set(k, blob)) { keys.push(k); n++; }
      }
      store.set('guita.micaExtra', keys);
      await loadExtraGrid();
      toast(n ? `${n} foto${n > 1 ? 's' : ''} agregada${n > 1 ? 's' : ''}` : 'No se pudo agregar');
      render(); renderSheet();
    });
  }
  function pickVideo(slot) {
    filePicker('video/*', false, async ([f]) => {
      if (!f) return;
      toast('Guardando video…');
      const ok = await idb.set('video.' + slot, f);
      forgetBlob('video.' + slot);
      if (ok) { store.set('guita.vidname.' + slot, f.name || 'video'); toast('Video guardado'); } else toast('No se pudo guardar el video (¿muy pesado?)');
      if (!isBusy()) render(); renderSheet();
    });
  }

  let toastT = null;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2400);
  }

  /* =======================================================================
     Arranque
     ======================================================================= */
  document.title = S.appName;
  route = fromHash();
  resetTransient();
  let launched = false;
  try { launched = sessionStorage.getItem('guita.launched') === '1'; sessionStorage.setItem('guita.launched', '1'); } catch (e) { /* nada */ }
  if (!launched && route === 'menu' && S.launchScene && S.launchScene !== 'menu' && ROUTES.includes(S.launchScene)) {
    route = S.launchScene;
    try { history.replaceState(null, '', '#' + route); } catch (e) { /* nada */ }
  }
  render();
  loadExtraGrid().then(() => { if (extraGrid.length && ['29', '38'].includes(route) && !isBusy()) render(); });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').then(() => { if (route === 'menu') navigator.serviceWorker.ready.then(() => setTimeout(() => { if (route === 'menu') renderMenu(); }, 800)); }).catch(() => { /* nada */ });
  }
})();
