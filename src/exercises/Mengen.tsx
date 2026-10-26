import { useEffect, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { makeDeck, pick, range, rnd, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const ROUNDS = 10;
const COLS = 5;

type Thing = { one: string; many: string; emoji: string };
const THINGS: Thing[] = [
  { one: 'ein Ball', many: 'Bälle', emoji: '⚽' },
  { one: 'ein Apfel', many: 'Äpfel', emoji: '🍎' },
  { one: 'ein Fisch', many: 'Fische', emoji: '🐟' },
  { one: 'eine Blume', many: 'Blumen', emoji: '🌸' },
  { one: 'ein Auto', many: 'Autos', emoji: '🚗' },
  { one: 'ein Stern', many: 'Sterne', emoji: '⭐' },
  { one: 'ein Marienkäfer', many: 'Marienkäfer', emoji: '🐞' },
  { one: 'eine Ente', many: 'Enten', emoji: '🦆' },
  { one: 'eine Erdbeere', many: 'Erdbeeren', emoji: '🍓' },
];

type Prefs = { max: 5 | 10 | 20; order: 'reihe' | 'wild' };
/** One object on the board: grid cell plus a little random offset (in % of a cell) when scattered. */
type Spot = { cell: number; dx: number; dy: number; rot: number };
type Question = { n: number; thing: Thing; spots: Spot[] };

const amount = (n: number, t: Thing) => (n === 1 ? t.one : `${n} ${t.many}`);

function makeQuestions(prefs: Prefs): Question[] {
  const rows = Math.ceil(prefs.max / COLS);
  return makeDeck(range(1, prefs.max), ROUNDS).map((n) => {
    // In rows the objects fill the board line by line (groups of five); scattered they take random cells.
    const cells = prefs.order === 'reihe' ? range(0, n - 1) : shuffle(range(0, rows * COLS - 1)).slice(0, n);
    const spots = cells.map((cell) =>
      prefs.order === 'reihe' ? { cell, dx: 0, dy: 0, rot: 0 } : { cell, dx: rnd(-18, 18), dy: rnd(-18, 18), rot: rnd(-25, 25) },
    );
    return { n, thing: pick(THINGS), spots };
  });
}

/** Count a set of objects and tap the matching number. Tapping an object marks it as counted. */
export function Mengen() {
  const [prefs, setPrefs] = useStored<Prefs>('mengen', { max: 10, order: 'reihe' });
  const { results, round, score, push } = useRounds(ROUNDS);
  const [questions, setQuestions] = useState(() => makeQuestions(prefs));
  const [counted, setCounted] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();
  const q = questions[Math.min(round, ROUNDS - 1)];
  const text = `Wie viele ${q.thing.many} siehst du?`;
  const rows = Math.ceil(prefs.max / COLS);

  useEffect(() => {
    if (!solved) say(text, 'queue');
  }, [text, solved]);

  function change(p: Prefs) {
    setPrefs(p);
    setQuestions(makeQuestions(p));
    setCounted([]);
    setWrong([]);
    setSolved(false);
  }

  function tapThing(i: number) {
    if (solved || counted.includes(i)) return;
    sfx.unlock();
    sfx.tick();
    const next = [...counted, i];
    setCounted(next);
    say(String(next.length));
  }

  function answer(k: number) {
    if (solved || wrong.includes(k)) return;
    sfx.unlock();
    if (k === q.n) {
      sfx.ok();
      setSolved(true);
      say(`Richtig! Das ${q.n === 1 ? 'ist' : 'sind'} ${amount(q.n, q.thing)}.`);
      later(() => {
        push(wrong.length === 0);
        setCounted([]);
        setWrong([]);
        setSolved(false);
        if (round + 1 >= ROUNDS) setDone(true);
      }, 2600);
    } else {
      sfx.bad();
      setWrong((w) => [...w, k]);
      setCounted([]);
      say('Nicht ganz. Tipp die Dinge an und zähl nochmal mit.');
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} Mengen beim ersten Versuch richtig gezählt.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text} />
      <Settings>
        <Segmented label="Zahlenraum" options={[['bis 5', 5], ['bis 10', 10], ['bis 20', 20]]} value={prefs.max} onChange={(max) => change({ ...prefs, max })} />
        <Segmented label="Anordnung" options={[['in Reihen', 'reihe'], ['durcheinander', 'wild']]} value={prefs.order} onChange={(order) => change({ ...prefs, order })} />
      </Settings>
      <div className="count-board" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }} role="group" aria-label={`${q.n} ${q.thing.many}`}>
        {q.spots.map((s, i) => {
          const no = counted.indexOf(i);
          return (
            <button
              key={`${round}-${i}`}
              type="button"
              className={`count-thing${no >= 0 ? ' counted' : ''}`}
              style={{
                gridRow: Math.floor(s.cell / COLS) + 1,
                gridColumn: (s.cell % COLS) + 1,
                transform: `translate(${s.dx}%, ${s.dy}%) rotate(${s.rot}deg)`,
              }}
              onClick={() => tapThing(i)}
              aria-label={no >= 0 ? `gezählt: ${no + 1}` : q.thing.many}
            >
              <span className="count-emoji">{q.thing.emoji}</span>
              {no >= 0 && <span className="count-no">{no + 1}</span>}
            </button>
          );
        })}
      </div>
      <div className="pad">
        {range(1, prefs.max).map((k) => (
          <button
            key={k}
            type="button"
            className={`tile${solved && k === q.n ? ' good' : ''}${wrong.includes(k) ? ' bad' : ''}`}
            disabled={solved || wrong.includes(k)}
            onClick={() => answer(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="hint">Tipp: Antippen zum Mitzählen – jedes angetippte Ding bekommt seine Zahl.</p>
    </Shell>
  );
}
