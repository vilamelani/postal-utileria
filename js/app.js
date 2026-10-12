/* =========================================================================
   GUITA · Utilería digital · Episodio 1
   App tipo Instagram ficticia para usar en cámara.
   Gestos ocultos:
     · Mantener apretada ~1 s la esquina SUPERIOR IZQUIERDA → menú oculto
     · Doble toque en la esquina INFERIOR DERECHA → avanzar contador (perfil)
     · 9H: tocar la pantalla negra → arrancan las notificaciones
   ========================================================================= */
(() => {
  'use strict';

  const D = window.GUITA_DEFAULTS;
  const NOTIFS = window.GUITA_NOTIFS;
  const $ = (s, el = document) => el.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

  const R = merge({ step: { '7E': 0, '7G': 0 }, sub: { '7E': null } }, store.get('guita.runtime', {}));
  R.sub['9H'] = 'arm';
  const saveRuntime = () => store.set('guita.runtime', { step: R.step, sub: { '7E': R.sub['7E'] } });
  let route = 'menu';
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  const DEFAULT_IMG = { avatar: 'img/avatar.jpg', post: 'img/post.jpg', wallpaper: null };
  const img = (k) => store.get('guita.img.' + k, null) || DEFAULT_IMG[k];

  const phone = $('#phone');
  const sbEl = $('#sb');
  const screen = $('#screen');
  const sheetWrap = $('#sheetWrap');
  const sheet = $('#sheet');

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
    finger: '<svg viewBox="0 0 24 24"><path d="M7.5 5.5A8 8 0 0 1 20 12v2"/><path d="M4 9.5A8 8 0 0 1 5.5 7"/><path d="M4 13v-1a8 8 0 0 0 0 0"/><path d="M8 20a10 10 0 0 0 1.5-6V12a2.5 2.5 0 0 1 5 0v1.5"/><path d="M12 12v2a14 14 0 0 1-2 7"/><path d="M17 16.5a17 17 0 0 1-1 4"/><path d="M6.5 17A7 7 0 0 0 7 14v-2a5 5 0 0 1 9.6-2"/></svg>'
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
    // Android: triángulo
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

  /* "tone": color del texto de la barra de estado y del indicador de inicio */
  let chromeState = { tone: 'auto', lock: false, hidden: false, overlay: false };
  function applyChrome(next) {
    if (next) chromeState = next;
    phone.dataset.platform = S.platform;
    phone.dataset.theme = S.theme;
    phone.dataset.sbtone = chromeState.overlay ? 'overlay' : chromeState.tone;
    phone.dataset.hbtone = chromeState.overlay ? 'light' : chromeState.tone;
    phone.classList.toggle('no-chrome', !!chromeState.hidden);
    phone.classList.toggle('real-sb', !fakeSBVisible());
    renderSB(chromeState.lock);
    syncTopColor();
  }

  /* Color de fondo "detrás" de la barra de estado real (iPhone).
     iOS pinta su barra con el color de la página, así que lo sincronizamos
     con la pantalla que se está mostrando: blanco en la app clara,
     negro en la oscura / pantalla bloqueada, marrón en las pantallas de equipo. */
  const desktopPreview = matchMedia('(min-width: 640px) and (pointer: fine)');
  function topColor() {
    if (chromeState.crew) return '#1c1311';
    if (chromeState.hidden || chromeState.overlay || chromeState.lock) return '#000000';
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
  setInterval(() => { if (S.clockMode !== 'fixed') { renderSB(chromeState.lock); const t = $('.lk-time'); if (t) t.textContent = timeStr(); } }, 10000);

  /* =======================================================================
     Router
     ======================================================================= */
  const ROUTES = ['menu', '7E', '7G', '9H'];
  function fromHash() {
    const h = (location.hash || '').replace('#', '');
    return ROUTES.includes(h) ? h : 'menu';
  }
  window.addEventListener('hashchange', () => { route = fromHash(); stop9H(); R.sub['9H'] = 'arm'; render(); });

  function render() {
    clearTimers();
    phone.dataset.route = route;
    if (route === 'menu') return renderMenu();
    if (route === '7E') return render7E();
    if (route === '7G') return renderProfile('7G');
    if (route === '9H') return render9H();
  }

  /* =======================================================================
     Menú de escenas (equipo)
     ======================================================================= */
  function renderMenu() {
    applyChrome({ tone: 'light', hidden: true, crew: true });
    const inst = isStandalone();
    const off = navigator.serviceWorker && navigator.serviceWorker.controller;
    screen.innerHTML = `
      <div class="crew">
        <div class="kicker">GUITA · Utilería digital</div>
        <h1>Episodio 1</h1>
        <p class="sub">App: <b>${esc(S.appName)}</b> · Cuenta <b>@${esc(S.account.username)}</b></p>

        <a class="scene" href="#7E"><span class="tag">7E</span><span><b>Crean la cuenta</b><small>Bienvenida → formulario → perfil vacío. Refresh: ${S.s7E.steps.map(fmtNum).join(' → ')} seguidores.</small></span></a>
        <a class="scene" href="#7G"><span class="tag">7G</span><span><b>Actualizan seguidores</b><small>Perfil con 1 publicación. Refresh: ${S.s7G.steps.map(fmtNum).join(' → ')}.</small></span></a>
        <a class="scene" href="#9H"><span class="tag">9H</span><span><b>Lluvia de notificaciones</b><small>Pantalla negra → se enciende y entran notificaciones sin parar${canVibrate ? ', con vibración' : ''}.</small></span></a>

        <button class="crew-btn ghost" data-act="open-sheet">Ajustes del celular y contenidos</button>

        <div class="howto">
          <h3>Gestos ocultos</h3>
          <ul>
            <li><b>Menú oculto:</b> mantener apretada 1 segundo la esquina <b>superior izquierda</b>.</li>
            <li><b>Refresh:</b> deslizar el perfil hacia abajo, como en la app real. Cada refresh pasa al número siguiente.</li>
            <li><b>Avanzar sin deslizar:</b> doble toque en la esquina <b>inferior derecha</b>.</li>
            <li><b>Reiniciar la toma:</b> menú oculto → “Reiniciar escena”.</li>
            <li><b>9H:</b> tocar <b>Armar</b>; la pantalla queda negra. Arranca sola con el temporizador o al tocar la pantalla.</li>
          </ul>
        </div>

        <p class="status-line">
          Sistema: <b>${S.platform === 'ios' ? 'iPhone' : 'Android'}</b> ·
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
          <button class="btn-outline" type="button" data-go7e="form">Crear cuenta nueva</button>
          <div class="w-brand wordmark">${esc(S.appName)}</div>
        </div>
      </div></div>`;
  }

  function renderForm() {
    applyChrome({ tone: 'auto' });
    const a = S.account;
    const mode = S.s7E.fieldMode;
    const field = (key, label, preset, type = 'text') => {
      const val = mode === 'filled' ? preset : '';
      return `<label class="fl"><input type="${type}" data-preset="${esc(preset)}" value="${esc(val)}" placeholder=" " autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="next"><span>${label}</span></label>`;
    };
    screen.innerHTML = `
      <div class="ig"><div class="f">
        <div class="f-top"><button type="button" data-go7e="welcome" aria-label="Volver">${S.platform === 'ios' ? I.backIOS : I.backAnd}</button></div>
        <div class="f-body">
          <h1>Creá tu cuenta</h1>
          <p class="lead">Completá tus datos para registrarte en ${esc(S.appName)}.</p>
          ${field('email', 'Celular o correo electrónico', a.email)}
          ${field('name', 'Nombre completo', a.fullName)}
          ${field('user', 'Nombre de usuario', a.username)}
          ${field('pass', 'Contraseña', a.password, 'password')}
          <button class="btn-primary" type="button" id="createBtn">Crear cuenta</button>
          <p class="terms">Al registrarte, aceptás nuestras Condiciones, la Política de privacidad y la Política de cookies.</p>
        </div>
        <div class="f-foot">¿Ya tenés una cuenta? Iniciá sesión</div>
      </div></div>`;

    if (mode === 'magic') {
      // "Tipeo mágico": cualquier tecla escribe la letra correcta del texto preparado.
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
      document.activeElement && document.activeElement.blur();
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
     Perfil (7E y 7G) con pull-to-refresh
     ======================================================================= */
  function fmtNum(n) {
    n = Math.round(+n || 0);
    if (n < 10000) return n.toLocaleString('es-AR');
    if (n < 1000000) return (Math.floor(n / 100) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' mil';
    return (Math.floor(n / 100000) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M';
  }
  const plural = (n, one, many) => (Math.round(n) === 1 ? one : many);

  function sceneCfg(id) { return id === '7E' ? S.s7E : S.s7G; }
  function curFollowers(id) {
    const steps = sceneCfg(id).steps;
    const i = Math.max(0, Math.min(steps.length - 1, R.step[id] || 0));
    return steps[i] ?? 0;
  }

  function renderProfile(id) {
    applyChrome({ tone: 'auto' });
    const c = sceneCfg(id);
    const a = S.account;
    const f = curFollowers(id);
    const posts = +c.posts || 0;
    const ptr = S.platform === 'ios'
      ? `<svg class="ios-spin" viewBox="0 0 24 24">${spinnerLines('var(--muted)')}</svg>`
      : `<span class="and-spin"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg></span>`;
    const grid = posts > 0
      ? `<div class="p-grid">${Array.from({ length: posts }, () => `<div style="background-image:url('${img('post')}')"></div>`).join('')}</div>`
      : `<div class="p-empty"><i>${I.camera}</i><h3>Compartí fotos y videos</h3><p>Cuando compartas fotos y videos, aparecerán en tu perfil.</p><a>Compartí tu primera foto</a></div>`;

    screen.innerHTML = `
      <div class="ig">
        <div class="p-top">
          <div class="p-user">${esc(a.username)}${I.chev}</div>
          <div class="p-actions"><span>${I.add}</span><span>${I.menu}</span></div>
        </div>
        <div class="p-scroll" id="scroller">
          <div class="ptr" id="ptr">${ptr}</div>
          <div class="p-content" id="ptrContent">
            <section class="p-head">
              <div class="p-avatar"><img src="${img('avatar')}" alt=""><span class="plus">${I.plus}</span></div>
              <div class="p-right">
                <div class="p-name">${esc(a.fullName)}</div>
                <div class="p-stats">
                  <div class="p-stat"><b>${fmtNum(posts)}</b><span>${plural(posts, 'publicación', 'publicaciones')}</span></div>
                  <div class="p-stat"><b data-stat="followers">${fmtNum(f)}</b><span data-stat="followersLabel">${plural(f, 'seguidor', 'seguidores')}</span></div>
                  <div class="p-stat"><b>${fmtNum(c.following)}</b><span>seguidos</span></div>
                </div>
              </div>
            </section>
            ${c.showBio && a.bio ? `<div class="p-bio">${esc(a.bio)}</div>` : ''}
            <div class="p-btns"><span>Editar perfil</span><span>Compartir perfil</span></div>
            <div class="p-hl"><div><i>${I.plus}</i>Nuevo</div></div>
            <div class="p-tabs"><span class="on">${I.grid}</span><span>${I.reels}</span><span>${I.tagged}</span></div>
            ${grid}
          </div>
        </div>
        <nav class="p-nav">
          <span>${I.home}</span><span>${I.search}</span><span>${I.add}</span><span>${I.reels}</span>
          <span class="me"><img src="${img('avatar')}" alt=""></span>
        </nav>
      </div>`;
    attachPTR($('#scroller'), $('#ptrContent'), $('#ptr'), () => advance(id, +1));
  }

  function updateFollowers(id) {
    const f = curFollowers(id);
    const b = $('[data-stat="followers"]');
    const l = $('[data-stat="followersLabel"]');
    if (b) b.textContent = fmtNum(f);
    if (l) l.textContent = plural(f, 'seguidor', 'seguidores');
  }

  function advance(id, dir) {
    const steps = sceneCfg(id).steps;
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
    // mouse (para probar en la compu)
    scroller.addEventListener('mousedown', (e) => { begin(e.clientY); const mm = (ev) => move(ev.clientY, ev); const mu = () => { end(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); }; window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu); });
  }

  /* =======================================================================
     9H · pantalla negra → pantalla bloqueada con notificaciones
     ======================================================================= */
  let nIdx = 0, nInterval = 1.6, vibTimer = null, notifTimer = null;

  function render9H() {
    const st = R.sub['9H'];
    if (st === 'arm') {
      applyChrome({ tone: 'light', hidden: true, crew: true });
      const c = S.s9H;
      const trig = { timer: `Arranca sola a los ${c.delay} s`, tap: 'Arranca al tocar la pantalla', both: `Arranca a los ${c.delay} s o antes si se toca la pantalla` }[c.trigger];
      screen.innerHTML = `
        <div class="crew">
          <div class="kicker">Escena 9H</div>
          <h1>Lluvia de notificaciones</h1>
          <p class="sub">${trig}. Notificaciones cada ${c.interval} s${c.accelerate ? ', cada vez más rápido' : ''}.</p>
          <button class="crew-btn big" data-act="arm">ARMAR</button>
          <div class="howto">
            <h3>Antes de grabar</h3>
            <ul>
              <li>Brillo del celular al máximo y en modo “No molestar” para que no entren notificaciones reales.</li>
              <li>Vibración: <b>${canVibrate ? (c.vibrate === 'off' ? 'apagada (cambiar en el menú oculto)' : c.vibrate === 'continuous' ? 'continua' : 'una por notificación') : 'este celular no permite vibrar desde una web (iPhone). Usar Android.'}</b></li>
              ${canVibrate ? '<li>En Ajustes del sistema → Sonido y vibración → subir la <b>intensidad de vibración</b> al máximo.</li>' : ''}
              <li>Para cortar: mantener apretada la esquina superior izquierda → “Detener”.</li>
            </ul>
          </div>
          <a class="crew-btn ghost" href="#menu" style="display:grid;place-items:center;text-decoration:none">Volver a escenas</a>
        </div>`;
      return;
    }
    if (st === 'off') {
      applyChrome({ tone: 'light', hidden: true });
      screen.innerHTML = '<div class="off" id="off"></div>';
      if (S.s9H.trigger !== 'timer') {
        $('#off').addEventListener('click', () => { if (!suppressClick) start9H(); });
      }
      if (S.s9H.trigger !== 'tap') later(start9H, Math.max(0, +S.s9H.delay) * 1000);
      return;
    }
    // on
    applyChrome({ tone: 'light', lock: true, overlay: fakeSBVisible() });
    const wall = img('wallpaper');
    screen.innerHTML = `
      <div class="lock ${wall ? '' : 'default-wall'}" ${wall ? `style="background-image:url('${wall}')"` : ''}>
        <div class="lk-head">
          <div class="lk-padlock">${I.padlock}</div>
          <div class="lk-date">${esc(cap(dateStr()))}</div>
          <div class="lk-time">${timeStr()}</div>
        </div>
        <div class="lk-list" id="lkList"></div>
        <div class="lk-bottom">${S.platform === 'ios' ? `<i>${I.torch}</i><i>${I.cam}</i>` : `<i>${I.finger}</i>`}</div>
      </div>`;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function arm9H() {
    goImmersive();
    if (canVibrate) { try { navigator.vibrate(1); } catch (e) { /* nada */ } }
    R.sub['9H'] = 'off';
    render();
  }

  function start9H() {
    if (route !== '9H' || R.sub['9H'] === 'on') return;
    clearTimers();
    R.sub['9H'] = 'on';
    render();
    nIdx = 0;
    nInterval = Math.max(0.2, +S.s9H.interval || 1.6);
    startVibration();
    notifTimer = setTimeout(tickNotif, 450);
  }

  function tickNotif() {
    const list = $('#lkList');
    if (!list || R.sub['9H'] !== 'on') return;
    pushNotif(list, NOTIFS[nIdx % NOTIFS.length]);
    nIdx++;
    if (S.s9H.vibrate === 'each' && canVibrate) { try { navigator.vibrate(350); } catch (e) { /* nada */ } }
    if (S.s9H.accelerate) nInterval = Math.max(+S.s9H.minInterval || 0.35, nInterval * 0.88);
    notifTimer = setTimeout(tickNotif, nInterval * 1000);
  }

  function notifText(n) {
    const app = esc(S.appName);
    if (n.type === 'dm') return { title: esc(n.user), body: esc(n.text) };
    if (n.type === 'follow') return { title: app, body: `<b>${esc(n.user)}</b> comenzó a seguirte.` };
    return { title: app, body: `A <b>${esc(n.user)}</b> y ${n.others} personas más les gustó tu publicación.` };
  }

  function pushNotif(list, n) {
    const t = notifText(n);
    const el = document.createElement('div');
    if (S.platform === 'ios') {
      el.className = 'nt nt-ios';
      el.innerHTML = `${appIcon('md')}<div class="nt-main"><div class="nt-row"><span class="nt-title">${t.title}</span><span class="nt-time">ahora</span></div><div class="nt-text">${t.body}</div></div>`;
    } else {
      el.className = 'nt nt-and';
      el.innerHTML = `<div class="nt-head">${appIcon('sm')}<span>${esc(S.appName)}</span><span>· ahora</span></div>${n.type === 'dm' ? `<div class="nt-title">${t.title}</div>` : ''}<div class="nt-text">${t.body}</div>`;
    }
    list.prepend(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    // las anteriores pasan a "hace X min" de a poco
    const items = list.children;
    for (let i = 1; i < items.length; i++) {
      const tm = items[i].querySelector('.nt-time, .nt-head span:last-child');
      if (tm && i > 4) tm.textContent = S.platform === 'ios' ? (i > 12 ? 'hace 2 min' : 'hace 1 min') : (i > 12 ? '· 2 min' : '· 1 min');
    }
    while (list.children.length > 30) list.lastElementChild.remove();
  }

  function startVibration() {
    stopVibration();
    if (!canVibrate || S.s9H.vibrate !== 'continuous') return;
    const pulse = () => { try { navigator.vibrate(Array.from({ length: 20 }, (_, i) => (i % 2 ? 40 : 460))); } catch (e) { /* nada */ } };
    pulse();
    vibTimer = setInterval(pulse, 9700);
  }
  function stopVibration() {
    if (vibTimer) clearInterval(vibTimer);
    vibTimer = null;
    if (canVibrate) { try { navigator.vibrate(0); } catch (e) { /* nada */ } }
  }
  function stop9H() {
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = null;
    stopVibration();
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
    // doble toque esquina inferior derecha → avanzar contador
    if ((route === '7E' || route === '7G') && p.x > p.w - 84 && p.y > p.h - 96) {
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

  // clicks de la interfaz
  screen.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go7e]');
    if (g) { R.sub['7E'] = g.dataset.go7e; saveRuntime(); render(); return; }
    const a = e.target.closest('[data-act]');
    if (a) act(a.dataset.act, a);
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
  let resetConfirm = false;

  function renderSheet() {
    const inScene = route === '7E' || route === '7G';
    let scene = '';
    if (inScene) {
      const steps = sceneCfg(route).steps;
      const i = R.step[route] || 0;
      scene = `
        <div class="sh-sec">Escena ${route}</div>
        <div class="sh-card">
          <div class="sh-big-num">${fmtNum(curFollowers(route))}<small>seguidores · paso ${i + 1} de ${steps.length}</small></div>
          <div class="sh-btns"><button type="button" data-act="prev">◀ Anterior</button><button type="button" data-act="next">Siguiente ▶</button></div>
          ${route === '7E' ? `<div class="sh-btns"><button type="button" data-act="go-welcome">Ir a bienvenida</button><button type="button" data-act="go-form">Ir a formulario</button></div>` : ''}
          <button type="button" class="sh-wide hot" data-act="reset-scene">Reiniciar escena</button>
          ${route === '7E' ? row('La escena arranca en', seg('s7E.start', [['welcome', 'Bienvenida'], ['form', 'Formulario'], ['profile', 'Perfil']])) : ''}
          ${route === '7E' ? row('Campos del formulario', seg('s7E.fieldMode', [['magic', 'Mágico'], ['filled', 'Llenos'], ['free', 'Libre']]), 'Mágico: cualquier tecla escribe el texto correcto') : ''}
          ${row('Seguidores por refresh', stepsInput(`s${route}.steps`), 'Separados por coma')}
          ${row('Publicaciones', txt(`s${route}.posts`, 'number', 'min="0" max="9"'))}
          ${row('Seguidos', txt(`s${route}.following`, 'number', 'min="0"'))}
          ${row('Mostrar biografía', seg(`s${route}.showBio`, [[true, 'Sí'], [false, 'No']]))}
        </div>`;
    }
    if (route === '9H') {
      scene = `
        <div class="sh-sec">Escena 9H</div>
        <div class="sh-card">
          <div class="sh-btns"><button type="button" class="hot" data-act="fire">Disparar ya</button><button type="button" data-act="stop9h">Detener</button></div>
          <div class="sh-btns"><button type="button" data-act="black9h">Pantalla negra</button><button type="button" data-act="rearm">Volver a armar</button></div>
          ${row('Arranque', seg('s9H.trigger', [['timer', 'Temporizador'], ['tap', 'Toque'], ['both', 'Ambos']]))}
          ${row('Temporizador (seg)', txt('s9H.delay', 'number', 'min="0" step="1"'))}
          ${row('Intervalo inicial (seg)', txt('s9H.interval', 'number', 'min="0.2" step="0.1"'))}
          ${row('Acelerar', seg('s9H.accelerate', [[true, 'Sí'], [false, 'No']]))}
          ${row('Vibración', seg('s9H.vibrate', [['continuous', 'Continua'], ['each', 'Por notif.'], ['off', 'No']]), canVibrate ? '' : 'Este celular no permite vibrar desde la app')}
        </div>`;
    }
    const thumb = (k) => { const u = img(k); return u ? `<span class="thumb" style="background-image:url('${u}')"></span>` : '<span class="thumb"></span>'; };
    sheet.innerHTML = `
      <div class="sh-grip"></div>
      <div class="sh-title"><b>Menú oculto</b><button type="button" data-act="close">Cerrar</button></div>
      ${scene}
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
      </div>
      <div class="sh-sec">Contenidos</div>
      <div class="sh-card">
        ${row('Nombre de la app', txt('appName'))}
        ${row('Usuario', txt('account.username'))}
        ${row('Nombre', txt('account.fullName'))}
        ${row('Foto de perfil', `<span style="display:flex;gap:8px;align-items:center">${thumb('avatar')}<div class="seg"><button type="button" data-act="pick" data-key="avatar">Cambiar</button><button type="button" data-act="unpick" data-key="avatar">Original</button></div></span>`)}
        ${row('Foto de la publicación', `<span style="display:flex;gap:8px;align-items:center">${thumb('post')}<div class="seg"><button type="button" data-act="pick" data-key="post">Cambiar</button><button type="button" data-act="unpick" data-key="post">Original</button></div></span>`)}
        ${row('Fondo pantalla bloqueada', `<span style="display:flex;gap:8px;align-items:center">${thumb('wallpaper')}<div class="seg"><button type="button" data-act="pick" data-key="wallpaper">Cambiar</button><button type="button" data-act="unpick" data-key="wallpaper">Original</button></div></span>`)}
      </div>
      <div class="sh-sec">Al abrir la app</div>
      <div class="sh-card">
        ${row('Abrir directo en', seg('launchScene', [['menu', 'Menú'], ['7E', '7E'], ['7G', '7G'], ['9H', '9H']]), 'Cerrá la app del todo y volvé a abrirla desde el ícono')}
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
    if (t === 'text' && inp.dataset.path === 'appName' && !v.trim()) v = D.appName;
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
    if (route === '9H' && R.sub['9H'] !== 'arm') { applyChrome(); }
    else {
      if (route === '7E' || route === '7G') {
        const steps = sceneCfg(route).steps; R.step[route] = Math.min(R.step[route] || 0, steps.length - 1);
      }
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
      case 'reset-scene':
        R.step[route] = 0;
        if (route === '7E') R.sub['7E'] = S.s7E.start;
        saveRuntime(); render(); closeSheet(); toast('Escena reiniciada');
        break;
      case 'arm': arm9H(); break;
      case 'fire': closeSheet(); R.sub['9H'] = 'off'; start9H(); break;
      case 'stop9h': stop9H(); clearTimers(); closeSheet(); toast('Detenido'); break;
      case 'black9h': stop9H(); R.sub['9H'] = 'off'; closeSheet(); render(); break;
      case 'rearm': stop9H(); R.sub['9H'] = 'arm'; closeSheet(); render(); break;
      case 'pick': pickImage(el.dataset.key); break;
      case 'unpick': store.del('guita.img.' + el.dataset.key); render(); renderSheet(); toast('Foto original'); break;
      case 'fullscreen':
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => toast('Este navegador no permite pantalla completa'));
        else toast('En iPhone: Compartir → “Agregar a inicio” y abrirla desde el ícono');
        break;
      case 'menu': closeSheet(); stop9H(); location.hash = '#menu'; break;
      case 'reset-all':
        if (!resetConfirm) { resetConfirm = true; renderSheet(); break; }
        resetConfirm = false;
        ['guita.settings', 'guita.runtime', 'guita.img.avatar', 'guita.img.post', 'guita.img.wallpaper'].forEach(store.del);
        S = clone(D); S.platform = isIOSDevice ? 'ios' : 'android';
        R.step = { '7E': 0, '7G': 0 }; R.sub['7E'] = null;
        render(); renderSheet(); toast('Ajustes restablecidos');
        break;
    }
  }

  function pickImage(key) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const im = new Image();
      im.onload = () => {
        const max = key === 'avatar' ? 640 : 1440;
        const sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const data = c.toDataURL('image/jpeg', 0.86);
        if (store.set('guita.img.' + key, data)) toast('Foto guardada'); else toast('No entró en la memoria; probá con una foto más chica');
        render(); renderSheet();
      };
      im.onerror = () => toast('No se pudo abrir esa imagen');
      im.src = url;
    };
    inp.click();
  }

  let toastT = null;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* =======================================================================
     Arranque
     ======================================================================= */
  document.title = S.appName;
  route = fromHash();
  // "Abrir directo en": sólo al abrir la app desde el ícono (una vez por arranque)
  let launched = false;
  try { launched = sessionStorage.getItem('guita.launched') === '1'; sessionStorage.setItem('guita.launched', '1'); } catch (e) { /* nada */ }
  if (!launched && route === 'menu' && S.launchScene && S.launchScene !== 'menu' && ROUTES.includes(S.launchScene)) {
    route = S.launchScene;
    try { history.replaceState(null, '', '#' + route); } catch (e) { /* nada */ }
  }
  render();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').then(() => { if (route === 'menu') navigator.serviceWorker.ready.then(() => setTimeout(() => { if (route === 'menu') renderMenu(); }, 800)); }).catch(() => { /* nada */ });
  }
})();
