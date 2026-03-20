/**
 * idle.js — Ambient / idol state machine
 *
 * When the user isn't typing, the sprite gradually transitions
 * through ambient states. On return, it wakes up.
 *
 * Timeline (from last keystroke):
 *   0s   → hold last emotion, fade badge
 *   5s   → neutral + breathe
 *   15s  → look left / look right
 *   30s  → yawn
 *   60s  → fall asleep
 *   ∞    → sleep cycle with occasional zzz
 */

const Idle = (() => {
  // Timers
  let t5, t15, t30, t60, lookLoop;
  let sleeping = false;
  let lastEmotion = 'neutral';

  const sprite = document.getElementById('sprite');
  const spriteBody = () => sprite.querySelector('.sprite__body');
  const leftEye = () => sprite.querySelector('.sprite__eye--left .sprite__pupil');
  const rightEye = () => sprite.querySelector('.sprite__eye--right .sprite__pupil');

  function clearAll() {
    clearTimeout(t5);
    clearTimeout(t15);
    clearTimeout(t30);
    clearTimeout(t60);
    clearInterval(lookLoop);
    stopLooking();
  }

  /** Called every time the user types (resets idle clock) */
  function poke() {
    if (sleeping) wake();
    clearAll();
    sleeping = false;

    // Save last real emotion so we can fade back gracefully
    lastEmotion = Sprite.getCurrentEmotion();

    // Phase 1 — 5s: just hold emotion, fade badge gently
    t5 = setTimeout(() => {
      Sprite.hideBadge();
    }, 5_000);

    // Phase 2 — 15s: go neutral, start ambient look-around
    t15 = setTimeout(() => {
      if (lastEmotion !== 'sleeping') {
        Sprite.setEmotion('neutral', 1.0);
      }
      startLooking();
    }, 15_000);

    // Phase 3 — 30s: yawn
    t30 = setTimeout(() => {
      yawn();
    }, 30_000);

    // Phase 4 — 60s: sleep
    t60 = setTimeout(() => {
      fallAsleep();
    }, 60_000);
  }

  /** Gentle left-right pupil drift */
  function startLooking() {
    clearInterval(lookLoop);
    lookLoop = setInterval(() => {
      const directions = [
        { x: -5, y: 0 },
        { x:  5, y: 0 },
        { x:  0, y: 0 },
        { x: -3, y: -2 },
        { x:  3, y: 2 },
      ];
      const d = directions[Math.floor(Math.random() * directions.length)];
      movePupils(d.x, d.y);
    }, 2200);
  }

  function stopLooking() {
    clearInterval(lookLoop);
    // don't reset pupils here — main.js orientation owns that while typing
  }

  function movePupils(x, y) {
    sprite.querySelectorAll('.sprite__sclera').forEach(s => {
      s.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    });
  }

  /** Brief yawn: mouth opens wide, eyes squeeze, returns */
  function yawn() {
    const mouth = sprite.querySelector('.sprite__mouth');
    if (!mouth) return;

    mouth.style.transition = 'all 0.4s ease';
    mouth.style.width = '38px';
    mouth.style.height = '22px';
    mouth.style.borderRadius = '0 0 50% 50%';

    // squeeze eyes
    const eyes = sprite.querySelectorAll('.sprite__eye');
    eyes.forEach(e => {
      e.style.height = '6px';
      e.style.transition = 'height 0.3s ease';
    });

    setTimeout(() => {
      // reset mouth & eyes
      mouth.style.width = '';
      mouth.style.height = '';
      mouth.style.borderRadius = '';
      eyes.forEach(e => { e.style.height = ''; });
    }, 1200);
  }

  /** Transition into sleep state */
  function fallAsleep() {
    sleeping = true;
    // reset any orientation before sleeping
    sprite.style.transform = '';
    sprite.querySelectorAll('.sprite__sclera').forEach(s => s.style.transform = '');
    Sprite.setEmotion('sleeping', 1.0);
  }

  /** Wake up with a little startle */
  function wake() {
    sleeping = false;
    Sprite.setEmotion('surprised', 0.9);

    setTimeout(() => {
      Sprite.setEmotion('neutral', 0.8);
    }, 800);
  }

  /** Called on first load — start asleep, wake on first interaction */
  function init() {
    sleeping = true;
    Sprite.setEmotion('sleeping', 1.0);
  }

  return { poke, init };
})();
