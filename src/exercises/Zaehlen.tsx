import { useEffect, useMemo, useState } from 'react';
import { Finish, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater } from '../lib/hooks';
import { chainColor, range, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

type Props = { from: number; to: number };

/** Tap the numbers in order – counting up (1 → 20) or a rocket countdown (10 → 1). */
export function Zaehlen({ from, to }: Props) {
  const countdown = from > to;
  const step = countdown ? -1 : 1;
  const [mixed, setMixed] = useStored(`zaehlen-${from}-${to}-mixed`, false);
  const [next, setNext] = useState(from);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<{ n: number; k: number } | null>(null);
  const [launched, setLaunched] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();

  const nums = useMemo(() => range(Math.min(from, to), Math.max(from, to)), [from, to]);
  const order = useMemo(() => (mixed ? shuffle(nums) : nums), [mixed, nums]);
  const text = countdown
    ? `Countdown! Tippe rückwärts von ${from} bis ${to}. Dann startet die Rakete.`
    : `Tippe die Zahlen der Reihe nach, von ${from} bis ${to}.`;
  const finished = countdown ? next < to : next > to;

  useEffect(() => say(text), [text]);

  function changeMixed(v: boolean) {
    setMixed(v);
    setNext(from);
    setMisses(0);
  }

  function tap(n: number) {
    if (finished) return;
    sfx.unlock();
    const isFound = countdown ? n > next : n < next;
    if (isFound) return;
    if (n === next) {
      sfx.ok();
      say(String(n));
      setMisses(0);
      const after = n + step;
      setNext(after);
      if (after === to + step) {
        if (countdown) {
          later(() => {
            setLaunched(true);
            sfx.go();
            say('Start!', 'queue');
          }, 500);
          later(() => setDone(true), 2400);
        } else {
          later(() => setDone(true), 1000);
        }
      }
    } else {
      sfx.bad();
      setMisses((m) => m + 1);
      setWrong((w) => ({ n, k: (w?.k ?? 0) + 1 }));
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish
          message={countdown ? 'Die Rakete ist gestartet!' : `Du hast bis ${to} gezählt.`}
          stars={3}
        />
      </Shell>
    );
  }

  const shown = countdown ? (next === from ? null : next + 1) : next === from ? null : next - 1;

  return (
    <Shell>
      <Task text={text} />
      <Settings>
        <Segmented label="Anordnung" options={[['Geordnet', false], ['Gemischt', true]]} value={mixed} onChange={changeMixed} />
      </Settings>
      {countdown && (
        <div className="launchpad">
          <svg className={`rocket${launched ? ' launch' : ''}`} viewBox="0 0 60 100" aria-hidden="true">
            <path className="flame" d="M22 72 Q30 100 38 72Z" fill="var(--sun)" />
            <path d="M18 56 L6 80 L19 73Z M42 56 L54 80 L41 73Z" fill="var(--red)" />
            <path d="M30 4 C45 18 47 46 42 72 L18 72 C13 46 15 18 30 4Z" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
            <circle cx="30" cy="36" r="8" fill="var(--blue)" stroke="var(--ink)" strokeWidth="3" />
          </svg>
          <div className={`readout${shown == null || launched ? ' small' : ''}`} aria-live="polite">
            {launched ? 'Start!' : shown ?? 'Bereit?'}
          </div>
        </div>
      )}
      <div className="number-grid">
        {order.map((n) => {
          const found = countdown ? n > next : n < next;
          const cls = [
            'tile',
            found ? `found ${chainColor(n)}` : '',
            !found && misses >= 3 && n === next ? 'hint' : '',
            wrong?.n === n ? `shake-${wrong.k % 2}` : '',
          ].join(' ');
          return (
            <button key={n} type="button" className={cls} onClick={() => tap(n)} aria-label={String(n)}>
              {n}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
