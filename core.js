/* ЦАС · ядро: утилиты, состояние, роутер, UI-примитивы */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'cas.demo.v1';

  /* ---------- строки и числа ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const nf = new Intl.NumberFormat('ru-RU');
  const nf2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const num = (n) => nf.format(Math.round(Number(n) || 0));
  const money = (n) => nf2.format(Number(n) || 0) + ' \u20BD';
  const pct = (n, digits) => (Number(n) || 0).toFixed(digits == null ? 1 : digits) + '\u00A0%';

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };

  const dateRu = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const dateTimeRu = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

  /* ---------- SHA-256 (синхронно, работает и на file://) ---------- */
  const sha256 = (function () {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    return function (msg) {
      const bytes = new TextEncoder().encode(String(msg));
      const l = bytes.length;
      const withOne = new Uint8Array((((l + 9) >> 6) + 1) << 6);
      withOne.set(bytes);
      withOne[l] = 0x80;
      const bitLen = l * 8;
      const dv = new DataView(withOne.buffer);
      dv.setUint32(withOne.length - 4, bitLen >>> 0, false);
      dv.setUint32(withOne.length - 8, Math.floor(bitLen / 4294967296), false);

      let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
          h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
      const w = new Uint32Array(64);

      for (let off = 0; off < withOne.length; off += 64) {
        for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
        for (let i = 16; i < 64; i++) {
          const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
          const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        for (let i = 0; i < 64; i++) {
          const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
          const ch = (e & f) ^ (~e & g);
          const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
          const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
          const mj = (a & b) ^ (a & c) ^ (b & c);
          const t2 = (S0 + mj) >>> 0;
          h = g; g = f; f = e; e = (d + t1) >>> 0;
          d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
      }
      return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => x.toString(16).padStart(8, '0')).join('');
    };
  })();

  /* ---------- хранилище ---------- */
  const Store = {
    state: null,
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.state = JSON.parse(raw);
          if (this.state && this.state.__v === DATA_VERSION) return this.state;
        }
      } catch (e) { /* повреждённое хранилище — пересоздаём */ }
      this.state = buildSeedState();
      if (typeof seedLedger === 'function') seedLedger(this.state);
      this.save();
      return this.state;
    },
    save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch (e) { /* приватный режим */ }
    },
    reset() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      this.state = buildSeedState();
      if (typeof seedLedger === 'function') seedLedger(this.state);
      this.save();
    }
  };

  /* ---------- уведомления и модальные ---------- */
  let toastTimer = [];
  const toast = (text, kind) => {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.textContent = text;
    wrap.appendChild(el);
    const t = setTimeout(() => el.remove(), 4200);
    toastTimer.push(t);
  };

  const modal = {
    open(html) {
      const veil = document.getElementById('modal-veil');
      const box = document.getElementById('modal');
      box.innerHTML = html;
      veil.hidden = false;
      const first = box.querySelector('button, input, select, textarea');
      if (first) first.focus();
      veil.onclick = (e) => { if (e.target === veil) modal.close(); };
    },
    close() {
      const veil = document.getElementById('modal-veil');
      if (veil) veil.hidden = true;
      const box = document.getElementById('modal');
      if (box) box.innerHTML = '';
    }
  };

  /* ---------- событийная шина ---------- */
  const events = {};
  const on = (name, fn) => { (events[name] = events[name] || []).push(fn); };
  const emit = (name, payload) => { (events[name] || []).forEach((fn) => { try { fn(payload); } catch (e) { console.warn(e); } }); };

  /* ---------- роутер ---------- */
  const routes = {};
  const Router = {
    register(path, handler) { routes[path] = handler; },
    current() {
      const h = (location.hash || '#/').replace(/^#/, '');
      return h.split('?')[0] || '/';
    },
    go(path) {
      if (('#' + path) === location.hash) { Router.render(); return; }
      location.hash = path;
    },
    render() {
      const path = Router.current();
      const handler = routes[path] || routes['/'];
      const content = document.getElementById('content');
      if (!handler || !content) return;
      try {
        const res = handler(Store.state);
        content.innerHTML = res && res.html != null ? res.html : String(res || '');
        if (res && typeof res.after === 'function') res.after(content);
      } catch (err) {
        console.error(err);
        content.innerHTML = '<div class="note note--red">Не удалось отобразить экран. Откройте консоль — ошибка: ' + esc(err.message) + '</div>';
      }
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      emit('route', path);
    }
  };

  /* ---------- прочее ---------- */
  const uid = (prefix) => (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  global.CAS = {
    esc, num, money, pct, plural, dateRu, dateTimeRu, daysAgo,
    sha256, Store, toast, modal, on, emit, Router, uid, clone, round2, nf, nf2
  };
})(window);
