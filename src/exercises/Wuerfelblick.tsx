import { useEffect, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { range, rnd, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const ROUNDS = 10;
const DICE: Record<number, number[]> = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const cell = (i: number): [number, number] => [20 + (i % 3) * 30, 20 + Math.floor(i / 3) * 30];

type Phase = 'ready' | 'show' | 'ask' | 'answered';

/** Subitizing: dots flash briefly, the child names the amount without counting. */
export function Wuerfelblick() {
  const [prefs, setPrefs] = useStored('wuerfel', { time: 2000, mode: 'wuerfel' as 'wuerfel' | 'frei', max: 5 });
  const { results, round, score, push, last } = useRounds(ROUNDS);
  const [phase, setPhase] = useState<Phase>('ready');
  const [n, setN] = useState(0);
  const [dots, setDots] = useState<[number, number][]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const later = useLater();
  const text = 'Schau kurz hin. Wie viele Punkte siehst du?';

  useEffect(() => say(text), []);

  function show() {
    sfx.unlock();
    let k: number;
    do k = rnd(1, prefs.max);
    while (k === n);
    setN(k);
    setDots(
      prefs.mode === 'wuerfel'
        ? DICE[k].map(cell)
        : shuffle(range(0, 8))
            .slice(0, k)
            .map((i) => {
              const [x, y] = cell(i);
              return [x + rnd(-7, 7), y + rnd(-7, 7)];
            }),
    );
    setPicked(null);
    setPhase('show');
    later(() => {
      setPhase('ask');
      say('Wie viele waren es?');
    }, prefs.time);
  }

  function answer(k: number) {
    if (phase !== 'ask') return;
    const ok = k === n;
    setPicked(k);
    setPhase('answered');
    push(ok);
    if (ok) {
      sfx.ok();
      say(`Richtig, ${n}!`);
    } else {
      sfx.bad();
      say(n === 1 ? 'Schau, das war einer.' : `Schau, das waren ${n}.`);
    }
    if (round + 1 >= ROUNDS) later(() => setDone(true), 1800);
    else later(() => setPhase('ready'), ok ? 1300 : 2300);
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} auf einen Blick erkannt.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text} />
      <Settings>
        <Segmented label="Anzeigedauer" options={[['1 Sek.', 1000], ['2 Sek.', 2000], ['3 Sek.', 3000]]} value={prefs.time} onChange={(time) => setPrefs({ ...prefs, time })} />
        <Segmented label="Punktbild" options={[['Würfel', 'wuerfel'], ['Frei', 'frei']]} value={prefs.mode} onChange={(mode) => setPrefs({ ...prefs, mode })} />
        <Segmented label="Bis" options={[['bis 5', 5], ['bis 6', 6]]} value={prefs.max} onChange={(max) => setPrefs({ ...prefs, max })} />
      </Settings>
      <div className="dice-card">
        {(phase === 'show' || phase === 'answered') &&
          dots.map(([x, y], i) => <span key={i} className="dot" style={{ left: `${x}%`, top: `${y}%` }} />)}
        {phase === 'ready' && <div className="cover">Bereit?</div>}
        {phase === 'ask' && <div className="cover q">?</div>}
      </div>
      {phase === 'ready' && !last ? (
        <button className="btn-big narrow" type="button" onClick={show}>
          Zeigen!
        </button>
      ) : (
        <div className="answers">
          {range(1, prefs.max).map((k) => (
            <button
              key={k}
              type="button"
              className={`ans${phase === 'answered' && k === n ? ' good' : ''}${phase === 'answered' && k === picked && k !== n ? ' bad' : ''}`}
              disabled={phase !== 'ask'}
              onClick={() => answer(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </Shell>
  );
}
