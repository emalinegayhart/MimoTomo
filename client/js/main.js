/**
 * main.js
 * - click anywhere → type at that spot
 * - sprite orients toward active fragment (flip + pupil tracking)
 * - ctrl/cmd+backspace → delete last word
 * - enter → seal fragment, start new one below
 */

(() => {
  const input      = document.getElementById('input');
  const wallCanvas = document.getElementById('wall-canvas');
  const wallHint   = document.getElementById('wall-hint');
  const spriteEl   = document.getElementById('sprite');

  let debounceTimer  = null;
  let fadeTimer      = null;
  let activeFragment = null;
  let facingLeft     = false;

  // rolling history of last 3 sealed fragments for richer sentiment context
  const fragmentHistory = [];
  const HISTORY_MAX = 3;

  const DEBOUNCE_MS = 220;
  const FADE_DELAY  = 4000;
  const CLEAR_DELAY = 1600;

  // ── Focus ──────────────────────────────────────────────────

  function grabFocus() {
    input.focus({ preventScroll: true });
  }

  // ── Orientation — sprite looks toward active fragment ──────

  function orientTowards(fragEl) {
    if (!fragEl) {
      // reset: face forward, center pupils
      spriteEl.style.transform = '';
      facingLeft = false;
      spriteEl.querySelectorAll('.sprite__sclera').forEach(s => {
        s.style.transform = '';
      });
      return;
    }

    const sr = spriteEl.getBoundingClientRect();
    const spriteCx = sr.left + sr.width  / 2;
    const spriteCy = sr.top  + sr.height / 2;

    const fr = fragEl.getBoundingClientRect();
    // aim at the start of the text line (left edge, top)
    const textX = fr.left + Math.min(80, fr.width * 0.25);
    const textY = fr.top;

    const dx   = textX - spriteCx;
    const dy   = textY - spriteCy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // flip sprite horizontally when text is clearly to the left
    const shouldFaceLeft = dx < -60;
    if (shouldFaceLeft !== facingLeft) {
      facingLeft = shouldFaceLeft;
      spriteEl.style.transform = facingLeft ? 'scaleX(-1)' : '';
    }

    // slide the white sclera toward the text — account for mirror when facing left
    const maxP     = 3.5;
    const screenPx = (dx / dist) * maxP;
    const screenPy = (dy / dist) * maxP;
    const cssPx    = facingLeft ? -screenPx : screenPx;

    spriteEl.querySelectorAll('.sprite__sclera').forEach(s => {
      s.style.transform = `translate(calc(-50% + ${cssPx.toFixed(1)}px), calc(-50% + ${screenPy.toFixed(1)}px))`;
    });
  }

  // ── History helpers ────────────────────────────────────────

  function sealToHistory(text) {
    const t = text.trim();
    if (!t) return;
    fragmentHistory.push(t);
    if (fragmentHistory.length > HISTORY_MAX) fragmentHistory.shift();
  }

  function contextWithHistory(current) {
    return [...fragmentHistory, current.trim()].filter(Boolean).join(' ');
  }

  // ── Fragment helpers ───────────────────────────────────────

  function createFragment(x, y) {
    const el = document.createElement('div');
    el.className = 'text-fragment typing';
    const safeX = Math.min(x, window.innerWidth  - 240);
    const safeY = Math.min(y, window.innerHeight - 80);
    el.style.left     = `${safeX}px`;
    el.style.top      = `${safeY}px`;
    el.style.maxWidth = `${Math.max(200, window.innerWidth - safeX - 24)}px`;
    wallCanvas.appendChild(el);
    return el;
  }

  function fadeFragment(el, delay = 0) {
    if (!el || !el.parentNode) return;
    el.classList.remove('typing');
    setTimeout(() => {
      el.classList.add('fading');
      setTimeout(() => {
        el.remove();
        if (!wallCanvas.querySelector('.text-fragment')) {
          wallHint.classList.remove('hidden');
          orientTowards(null);
        }
      }, CLEAR_DELAY);
    }, delay);
  }

  function scheduleFragmentFade() {
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      if (activeFragment) sealToHistory(activeFragment.textContent);
      fadeFragment(activeFragment);
      activeFragment = null;
    }, FADE_DELAY);
  }

  // ── Click anywhere → new fragment at cursor ────────────────

  document.addEventListener('click', (e) => {
    if (e.target.closest('.emotion-badge')) return;

    // if current fragment has no text yet, just move it
    if (activeFragment && !activeFragment.textContent.trim()) {
      activeFragment.remove();
      activeFragment = null;
    } else if (activeFragment) {
      clearTimeout(fadeTimer);
      const prev = activeFragment;
      prev.classList.remove('typing');
      fadeFragment(prev, 300);
      activeFragment = null;
    }

    clearTimeout(debounceTimer);
    clearTimeout(fadeTimer);
    input.value = '';

    activeFragment = createFragment(e.clientX, e.clientY);
    orientTowards(activeFragment);
    wallHint.classList.add('hidden');
    grabFocus();
  });

  // focus on any keydown too (keyboard-first users)
  document.addEventListener('keydown', (e) => {
    if (e.target !== input && !e.metaKey && !e.ctrlKey && !e.altKey) grabFocus();
  });

  // ── Keyboard handling ──────────────────────────────────────

  input.addEventListener('keydown', (e) => {

    // ctrl/cmd + backspace → delete last word
    if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
      e.preventDefault();
      const val     = input.value;
      const trimmed = val.trimEnd();
      const lastSp  = trimmed.lastIndexOf(' ');
      input.value   = lastSp >= 0 ? trimmed.slice(0, lastSp + 1) : '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // enter → seal fragment, open new one just below
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = input.value.trim();
      if (trimmed) {
        Socket.sendText(trimmed);
      }

      // remember where to put the next fragment
      let nextX = Math.round(window.innerWidth  * 0.5 - 120);
      let nextY = Math.round(window.innerHeight * 0.62);

      if (activeFragment) {
        const rect = activeFragment.getBoundingClientRect();
        nextX = rect.left;
        nextY = rect.bottom + 10;
        const toFade = activeFragment;
        toFade.classList.remove('typing');
        fadeFragment(toFade, 500); // short hold, then fade
        activeFragment = null;
      }

      clearTimeout(debounceTimer);
      clearTimeout(fadeTimer);
      input.value = '';

      activeFragment = createFragment(nextX, nextY);
      orientTowards(activeFragment);
      return;
    }
  });

  // ── Input → write to fragment ──────────────────────────────

  input.addEventListener('input', () => {
    const text    = input.value;
    const trimmed = text.trim();

    // if no fragment yet (typed without clicking), place one center-ish
    if (!activeFragment) {
      activeFragment = createFragment(
        Math.round(window.innerWidth  * 0.5 - 120),
        Math.round(window.innerHeight * 0.62)
      );
      wallHint.classList.add('hidden');
      orientTowards(activeFragment);
    }

    activeFragment.textContent = text;
    activeFragment.classList.add('typing');
    activeFragment.classList.remove('fading');

    Idle.poke();
    clearTimeout(debounceTimer);

    if (trimmed.length === 0) {
      Sprite.setEmotion('neutral', 1.0);
      return;
    }

    Sprite.setEmotion('listening', 1.0);
    scheduleFragmentFade();

    debounceTimer = setTimeout(() => {
      Socket.sendText(trimmed);
    }, DEBOUNCE_MS);
  });

  // ── WebSocket events ───────────────────────────────────────

  Socket.on('emotion', (msg) => {
    Sprite.setEmotion(msg.emotion, msg.confidence);
  });

  Socket.on('connected', () => { /* stay sleeping on boot */ });

  Socket.on('disconnected', () => {
    Sprite.setEmotion('contemplative', 0.5);
  });

  // ── Boot ───────────────────────────────────────────────────

  Idle.init(); // starts sleeping
})();
