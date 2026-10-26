import { useEffect, useRef, useState } from 'react';
import { Finish, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater } from '../lib/hooks';
import { makeDeck, range, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { load, save, useStored } from '../lib/storage';

const PENALTY = 2000;
const BLITZ_MS = 1500;

type Prefs = { range: 5 | 10; count: 10 | 20; order: 'ordered' | 'mixed'; blitz: boolean };

const fmt = (ms: number) => (Math.max(0, ms) / 1000).toFixed(1).replace('.', ',') + ' s';

function frameCells(n: number, order: Prefs['order']) {
  const idx = range(0, 9);
  return new Set(order === 'mixed' ? shuffle(idx).slice(0, n) : idx.slice(0, n));
}

export function TenFrame({ filled, order, covered = false }: { filled: Set<number>; order: Prefs['order']; covered?: boolean }) {
  return (
    <div className="frame-wrap">
      <div className={`frame${covered ? ' covered' : ''}`} role="img" aria-label={covered ? 'Zehnerfeld, zugedeckt' : `Zehnerfeld mit ${filled.size} Kästchen`}>
        {range(0, 9).map((i) => (
          <div key={i} className={`cell${filled.has(i) ? ' on' : ''}${order !== 'mixed' && i >= 5 ? ' b' : ''}`} />
        ))}
      </div>
      {covered && <div className="peek">?</div>}
    </div>
  );
}

/** How many boxes are filled? Ten-frame flash cards against the clock. */
export function Zehnerfeld() {
  const [prefs, setPrefs] = useStored<Prefs>('zehnerfeld', { range: 10, count: 10, order: 'ordered', blitz: false });
  const [phase, setPhase] = useState<'start' | 'count' | 'play' | 'done'>('start');
  const [deck, setDeck] = useState<number[]>([]);
  const [i, setI] = useState(0);
  const [cells, setCells] = useState<Set<number>>(new Set());
  const [countdown, setCountdown] = useState(3);
  const [wrong, setWrong] = useState<number[]>([]);
  const [ok, setOk] = useState(false);
  const [covered, setCovered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ total: number; mistakes: number; best: number | null; record: boolean } | null>(null);
  const start = useRef(0);
  const mistakes = useRef(0);
  const blitzTimer = useRef(0);
  const later = useLater();
  const text = 'Wie viele Kästchen sind ausgemalt? Tippe so schnell du kannst die richtige Zahl.';
  const bestKey = `zehnerfeld-best-${prefs.range}-${prefs.count}-${prefs.order}-${prefs.blitz ? 1 : 0}`;

  useEffect(() => say(text), []);

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const tick = () => {
      setElapsed(performance.now() - start.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => () => clearTimeout(blitzTimer.current), []);

  function showCard(n: number) {
    setCells(frameCells(n, prefs.order));
    setWrong([]);
    setOk(false);
    setCovered(false);
    clearTimeout(blitzTimer.current);
    if (prefs.blitz) blitzTimer.current = window.setTimeout(() => setCovered(true), BLITZ_MS);
  }

  function go() {
    sfx.unlock();
    const d = makeDeck(range(1, prefs.range), prefs.count);
    setDeck(d);
    setI(0);
    mistakes.current = 0;
    setElapsed(0);
    setCells(frameCells(d[0], prefs.order));
    setCountdown(3);
    setPhase('count');
    sfx.tick();
    const steps = [2, 1, 0];
    steps.forEach((c, k) =>
      later(() => {
        if (c > 0) {
          setCountdown(c);
          sfx.tick();
        } else {
          sfx.go();
          start.current = performance.now();
          setPhase('play');
          showCard(d[0]);
        }
      }, 650 * (k + 1)),
    );
  }

  function answer(n: number) {
    if (phase !== 'play' || ok || wrong.includes(n)) return;
    const target = deck[i];
    if (n === target) {
      setOk(true);
      setCovered(false);
      clearTimeout(blitzTimer.current);
      sfx.ok();
      later(() => {
        const nextI = i + 1;
        if (nextI >= deck.length) finish();
        else {
          setI(nextI);
          showCard(deck[nextI]);
        }
      }, 420);
    } else {
      mistakes.current++;
      start.current -= PENALTY;
      setWrong((w) => [...w, n]);
      setCovered(false);
      sfx.bad();
    }
  }

  function finish() {
    const total = performance.now() - start.current;
    const prev = load<number | null>(bestKey, null);
    const record = prev == null || total < prev;
    if (record) save(bestKey, Math.round(total));
    setResult({ total, mistakes: mistakes.current, best: prev, record });
    setPhase('done');
  }

  if (phase === 'done' && result) {
    const stars = result.mistakes === 0 ? 3 : result.mistakes <= 2 ? 2 : 1;
    const msg =
      `${deck.length} Karten in ${fmt(result.total)}` +
      (result.mistakes ? `, ${result.mistakes} Fehler.` : ', ohne Fehler!') +
      (result.record ? (result.best == null ? ' Erste Bestzeit!' : ' Neuer Rekord!') : ` Bestzeit: ${fmt(result.best!)}.`);
    return (
      <Shell>
        <Finish message={msg} stars={stars} />
      </Shell>
    );
  }

  if (phase === 'start') {
    const best = load<number | null>(bestKey, null);
    return (
      <Shell>
        <Task text={text} />
        <div className="card flash">
          <div className="card-head">
            <span>Beispiel</span>
            <span className="ask">7</span>
          </div>
          <TenFrame filled={frameCells(7, prefs.order)} order={prefs.order} />
          <p className="caption">
            {prefs.order === 'mixed' ? 'Hier sind 7 Kästchen ausgemalt, kreuz und quer.' : 'Hier sind es 7: oben 5 rote, unten 2 blaue.'}
          </p>
        </div>
        <Settings>
          <Segmented label="Zahlen" options={[['1 bis 5', 5], ['1 bis 10', 10]]} value={prefs.range} onChange={(range) => setPrefs({ ...prefs, range })} />
          <Segmented label="Karten" options={[['10 Karten', 10], ['20 Karten', 20]]} value={prefs.count} onChange={(count) => setPrefs({ ...prefs, count })} />
          <Segmented label="Kästchen" options={[['geordnet', 'ordered'], ['durcheinander', 'mixed']]} value={prefs.order} onChange={(order) => setPrefs({ ...prefs, order })} />
          <Segmented label="Blitzblick" options={[['Blitz aus', false], ['Blitz an', true]]} value={prefs.blitz} onChange={(blitz) => setPrefs({ ...prefs, blitz })} />
        </Settings>
        <button className="btn-big" type="button" onClick={go}>
          Los geht's!
        </button>
        <p className="hint">
          {best != null ? `Bestzeit mit diesen Einstellungen: ${fmt(best)}. ` : ''}Falsch getippt kostet 2 Sekunden.
          {prefs.blitz ? ' Im Blitzmodus verschwinden die Kästchen nach 1,5 Sekunden.' : ''}
        </p>
      </Shell>
    );
  }

  return (
    <Shell
      progress={
        <div className="timebar">
          <div className="bar-track" aria-hidden="true">
            <i style={{ width: `${(i / deck.length) * 100}%` }} />
          </div>
          <span className="clock">{fmt(elapsed)}</span>
        </div>
      }
    >
      <div className={`card flash${ok ? ' ok' : ''}${wrong.length ? ` shake-${wrong.length % 2}` : ''}`} key={i}>
        <div className="card-head">
          <span>
            Karte {i + 1} von {deck.length}
          </span>
          <span className="ask">Wie viele?</span>
        </div>
        <TenFrame filled={cells} order={prefs.order} covered={covered} />
        {phase === 'count' && <div className="count-overlay">{countdown}</div>}
      </div>
      <div className="pad">
        {range(1, prefs.range).map((n) => (
          <button
            key={n}
            type="button"
            className={`tile${ok && n === deck[i] ? ' good' : ''}${wrong.includes(n) ? ' bad' : ''}`}
            onClick={() => answer(n)}
            disabled={wrong.includes(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </Shell>
  );
}
