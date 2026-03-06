import confetti from 'canvas-confetti';

const COLORS = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c'];

/** Light confetti burst for completing a block */
export function blockConfetti() {
  confetti({
    particleCount: 40,
    spread: 55,
    startVelocity: 25,
    gravity: 1.2,
    ticks: 80,
    origin: { x: 0.5, y: 0.7 },
    colors: COLORS,
    scalar: 0.8,
    disableForReducedMotion: true,
  });
}

/** Intense multi-burst confetti for finishing the entire workout */
export function finishConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  // Initial big burst
  confetti({
    particleCount: 80,
    spread: 100,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.6 },
    colors: COLORS,
    disableForReducedMotion: true,
  });

  // Side cannons
  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 45,
      startVelocity: 40,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 45,
      startVelocity: 40,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    requestAnimationFrame(frame);
  };
  frame();
}
