/**
 * sprite.js — Sprite DOM controller
 * Applies emotion classes, manages particles (tears, hearts, zzz, sweat).
 */

const Sprite = (() => {
  const EMOTIONS = [
    'neutral', 'listening', 'happy', 'excited', 'sad', 'distressed',
    'angry', 'anxious', 'surprised', 'contemplative', 'sleeping',
  ];

  const el = document.getElementById('sprite');
  const tearsEl = el.querySelector('.sprite__tears');
  const particlesEl = el.querySelector('.sprite__particles');
  const badge = document.getElementById('emotion-badge');
  const badgeEmotion = document.getElementById('badge-emotion');
  const badgeConfidence = document.getElementById('badge-confidence');

  let currentEmotion = 'neutral';
  let particleInterval = null;

  // Emotion → particle type
  const PARTICLE_MAP = {
    sad:         spawnTear,
    distressed:  spawnTear,
    happy:       spawnHeart,
    excited:     spawnHeart,
    sleeping:    spawnZzz,
    anxious:     spawnSweat,
  };

  // Emotion → badge color (matches CSS vars)
  const BADGE_COLORS = {
    happy:        '#f6d860',
    excited:      '#ffb347',
    sad:          '#74b9ff',
    distressed:   '#a29bfe',
    angry:        '#ff6b81',
    anxious:      '#55efc4',
    surprised:    '#fdcb6e',
    contemplative:'#b2bec3',
    neutral:      '#dfe6e9',
    sleeping:     '#9b8ec4',
  };

  function setEmotion(emotion, confidence = 1.0) {
    if (!EMOTIONS.includes(emotion)) emotion = 'neutral';

    const prev = currentEmotion;
    currentEmotion = emotion;

    // Swap CSS emotion class
    EMOTIONS.forEach(e => el.classList.remove(`emotion-${e}`));
    el.classList.add(`emotion-${emotion}`);

    // Body-level class for bg glow
    document.body.className = document.body.className
      .replace(/emotion-\S+/g, '').trim();
    document.body.classList.add(`emotion-${emotion}`);

    // Badge — don't flicker it on every keystroke during listening
    if (emotion !== 'listening') {
      badgeEmotion.textContent = emotion;
      badgeEmotion.style.color = BADGE_COLORS[emotion] || '#dfe6e9';
      badge.classList.remove('hidden');
    }

    // Particle loop
    clearInterval(particleInterval);
    particleInterval = null;

    const spawner = PARTICLE_MAP[emotion];
    if (spawner) {
      spawner(); // immediate first particle
      const rate = emotion === 'distressed' ? 400 :
                   emotion === 'excited'    ? 700 :
                   emotion === 'sleeping'   ? 3800 : 900;
      particleInterval = setInterval(spawner, rate);
    }
  }

  // ── Particle spawners ───────────────────────────────────────

  function spawnTear() {
    const t = document.createElement('div');
    t.className = 'tear';
    const side = Math.random() > 0.5 ? 1 : -1;
    // offset to align with bunny eyes
    t.style.left = `${58 + side * 20 + (Math.random() * 4 - 2)}px`;
    t.style.top = '52px';
    tearsEl.appendChild(t);
    t.addEventListener('animationend', () => t.remove());
  }

  function spawnHeart() {
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = '♥';
    h.style.left = `${20 + Math.random() * 60}px`;
    h.style.top = `${-5 + Math.random() * 10}px`;
    particlesEl.appendChild(h);
    h.addEventListener('animationend', () => h.remove());
  }

  function spawnZzz() {
    // max 1 zzz on screen at a time — no bunching
    if (particlesEl.querySelectorAll('.zzz').length >= 1) return;
    const z = document.createElement('div');
    z.className = 'zzz';
    const chars = ['z', 'z', 'z', 'Z', 'Z'];
    z.textContent = chars[Math.floor(Math.random() * chars.length)];
    z.style.left = `${52 + Math.random() * 18}px`;
    z.style.top  = `${8  + Math.random() * 8}px`;
    particlesEl.appendChild(z);
    z.addEventListener('animationend', () => z.remove());
  }

  function spawnSweat() {
    const s = document.createElement('div');
    s.className = 'sweat';
    s.style.left = `${60 + Math.random() * 15}px`;
    s.style.top = `${20 + Math.random() * 20}px`;
    particlesEl.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }

  function hideBadge() {
    badge.classList.add('hidden');
  }

  function getCurrentEmotion() {
    return currentEmotion;
  }

  return { setEmotion, hideBadge, getCurrentEmotion };
})();
