let enabled = true;
let ctx: AudioContext | null = null;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq: number, delay: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const s = a.currentTime + delay;
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(s);
  o.stop(s + dur + 0.03);
}

export const sfx = {
  /** Call from a tap handler so iOS unlocks audio. */
  unlock: () => void audio(),
  ok: () => {
    tone(660, 0, 0.12, 'sine', 0.18);
    tone(990, 0.08, 0.16, 'sine', 0.16);
  },
  bad: () => tone(200, 0, 0.22, 'triangle', 0.12),
  tick: () => tone(520, 0, 0.09, 'triangle', 0.14),
  go: () => tone(880, 0, 0.22, 'triangle', 0.16),
  flip: () => tone(420, 0, 0.06, 'triangle', 0.1),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.24, 'triangle', 0.15)),
};
