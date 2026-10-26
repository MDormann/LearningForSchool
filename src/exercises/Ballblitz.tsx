import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { pick, rnd } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const ROUNDS = 10;
const ASPECT = 0.8; // board height / width
const SHOW_MS = { langsam: 2500, mittel: 1500, blitz: 800 } as const;
const COLORS = {
  rot: { name: 'Rot', adj: 'rote', c: '#E5383B' },
  gruen: { name: 'Grün', adj: 'grüne', c: '#2DA84F' },
  gelb: { name: 'Gelb', adj: 'gelbe', c: '#F6C230' },
  blau: { name: 'Blau', adj: 'blaue', c: '#2E6BF0' },
};
type ColorKey = keyof typeof COLORS;
const PAIRS: [ColorKey, ColorKey][] = [
  ['rot', 'gruen'],
  ['gelb', 'blau'],
  ['rot', 'blau'],
];

type Prefs = { speed: keyof typeof SHOW_MS; level: 'leicht' | 'mittel' | 'schwer' };
type Ball = { x: number; y: number; r: number; ci: 0 | 1 };
type Round = { colors: [ColorKey, ColorKey]; counts: [number, number]; balls: Ball[] };

function genCounts(level: Prefs['level']): [number, number] {
  let s: number, b: number;
  if (level === 'leicht') {
    s = rnd(2, 5);
    b = s * 2 + rnd(0, 2);
  } else if (level === 'mittel') {
    s = rnd(4, 8);
    b = Math.ceil(s * 1.35) + rnd(0, 1);
  } else {
    s = rnd(6, 11);
    b = s + rnd(1, 2);
  }
  return Math.random() < 0.5 ? [b, s] : [s, b];
}

/** Random non-overlapping ball positions in board units (width 1, height ASPECT). */
function place(counts: [number, number]): Ball[] {
  let r = Math.min(0.075, (0.3 * Math.sqrt(ASPECT)) / Math.sqrt(counts[0] + counts[1]));
  for (let attempt = 0; attempt < 30; attempt++) {
    const list: (0 | 1)[] = [];
    counts.forEach((n, ci) => {
      for (let i = 0; i < n; i++) list.push(ci as 0 | 1);
    });
    list.sort(() => Math.random() - 0.5);
    const balls: Ball[] = [];
    let ok = true;
    for (const ci of list) {
      const ri = r * (0.88 + Math.random() * 0.24);
      let placed = false;
      for (let t = 0; t < 600 && !placed; t++) {
        const m = ri + 0.02;
        const x = m + Math.random() * (1 - 2 * m);
        const y = m + Math.random() * (ASPECT - 2 * m);
        if (balls.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + ri + 0.012)) {
          balls.push({ x, y, r: ri, ci });
          placed = true;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok) return balls;
    r *= 0.92;
  }
  return [];
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function makeRound(level: Prefs['level']): Round {
  const counts = genCounts(level);
  return { colors: pick(PAIRS), counts, balls: place(counts) };
}

type Phase = 'ready' | 'show' | 'hidden' | 'answered';

/** Approximate quantity: which color has more balls? Seen only for a moment, no counting. */
export function Ballblitz() {
  const [prefs, setPrefs] = useStored<Prefs>('ballblitz', { speed: 'mittel', level: 'leicht' });
  const { results, round, score, push } = useRounds(ROUNDS);
  const [r, setR] = useState<Round>(() => {
    const counts: [number, number] = [7, 4];
    return { colors: ['rot', 'gruen'], counts, balls: place(counts) };
  });
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const [done, setDone] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const later = useLater();
  const text = 'Wovon sind es mehr? Die Bälle sind nur ganz kurz zu sehen. Nicht zählen, einfach schnell schauen!';

  useEffect(() => say(text), []);

  // Draw the balls whenever the round or the board size changes.
  useLayoutEffect(() => {
    const el = board.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const draw = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width = Math.round(rect.width * dpr);
      cv.height = Math.round(rect.height * dpr);
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const W = rect.width;
      for (const b of r.balls) {
        const col = COLORS[r.colors[b.ci]].c;
        const x = b.x * W, y = b.y * W, rad = b.r * W;
        ctx.beginPath();
        ctx.ellipse(x + rad * 0.08, y + rad * 0.92, rad * 0.8, rad * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10,15,40,0.14)';
        ctx.fill();
        const g = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.08, x, y, rad);
        g.addColorStop(0, shade(col, 0.6));
        g.addColorStop(0.45, col);
        g.addColorStop(1, shade(col, -0.28));
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [r, done]);

  function start() {
    sfx.unlock();
    setR(makeRound(prefs.level));
    setPicked(null);
    setPhase('show');
    phaseRef.current = 'show';
    later(() => {
      if (phaseRef.current !== 'show') return;
      setPhase('hidden');
      say('Wovon waren es mehr?');
    }, SHOW_MS[prefs.speed]);
  }

  function answer(i: 0 | 1) {
    if (phase !== 'show' && phase !== 'hidden') return;
    const ok = r.counts[i] > r.counts[1 - i];
    setPicked(i);
    setPhase('answered');
    push(ok);
    const big = r.counts[0] > r.counts[1] ? 0 : 1;
    const small = 1 - big;
    const desc = `${r.counts[big]} ${COLORS[r.colors[big]].adj} und ${r.counts[small]} ${COLORS[r.colors[small]].adj}`;
    if (ok) {
      sfx.ok();
      say(`Richtig! ${desc}.`);
    } else {
      sfx.bad();
      say(`Fast! Es waren ${desc}.`);
    }
  }

  function next() {
    if (round >= ROUNDS) setDone(true);
    else start();
  }

  if (done) {
    const msg = score >= 9 ? 'Super Adleraugen!' : score >= 7 ? 'Richtig gut!' : score >= 5 ? 'Schon prima!' : 'Weiter üben, das wird!';
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} richtig. ${msg}`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  const correct = r.counts[0] > r.counts[1] ? 0 : 1;
  const status =
    phase === 'show'
      ? 'Schau genau hin …'
      : phase === 'hidden'
        ? 'Wovon waren es mehr?'
        : phase === 'answered'
          ? picked === correct
            ? `Richtig! ${r.counts[correct]} gegen ${r.counts[1 - correct]}.`
            : `Fast! Es waren ${r.counts[correct]} gegen ${r.counts[1 - correct]}.`
          : '';

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text}>Wovon sind es mehr? Nur kurz schauen, nicht zählen!</Task>
      <Settings>
        <Segmented label="Zeit" options={[['Langsam', 'langsam'], ['Mittel', 'mittel'], ['Blitz', 'blitz']]} value={prefs.speed} onChange={(speed) => setPrefs({ ...prefs, speed })} />
        <Segmented label="Schwierigkeit" options={[['Leicht', 'leicht'], ['Mittel', 'mittel'], ['Schwer', 'schwer']]} value={prefs.level} onChange={(level) => setPrefs({ ...prefs, level })} />
      </Settings>
      <div
        ref={board}
        className={`ball-board${phase === 'hidden' ? ' covered' : ''}${phase === 'answered' ? (picked === correct ? ' good' : ' soft') : ''}`}
        onClick={() => phase === 'answered' && next()}
      >
        <canvas ref={canvas} aria-label="Spielfeld mit Bällen" />
        <div className="ball-cover" aria-hidden="true">?</div>
        {phase === 'show' && <div className="ball-timer" style={{ animationDuration: `${SHOW_MS[prefs.speed]}ms` }} />}
        {phase === 'ready' && (
          <div className="ball-overlay">
            <button className="btn-big narrow" type="button" onClick={start}>
              Los geht's
            </button>
          </div>
        )}
      </div>
      <p className={`status${phase === 'answered' ? (picked === correct ? ' good' : ' soft') : ''}`} aria-live="polite">
        {status}
      </p>
      <div className="color-answers">
        {([0, 1] as const).map((i) => (
          <button
            key={i}
            type="button"
            className={`color-ans${phase === 'answered' && picked === i ? (i === correct ? ' right' : ' wrong') : ''}`}
            disabled={phase !== 'show' && phase !== 'hidden'}
            onClick={() => answer(i)}
            style={{ ['--c' as string]: COLORS[r.colors[i]].c }}
          >
            <span className="ball-dot" />
            <span className="lbl">Mehr {COLORS[r.colors[i]].name}</span>
            <span className="cnt">{phase === 'answered' ? r.counts[i] : ''}</span>
          </button>
        ))}
      </div>
      {phase === 'answered' && (
        <button className="btn-big narrow" type="button" onClick={next}>
          {round >= ROUNDS ? 'Ergebnis' : 'Weiter'}
        </button>
      )}
    </Shell>
  );
}
