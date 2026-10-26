import { useEffect, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { pick, rnd, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const ROUNDS = 10;
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'] as const;
const COLORS = ['var(--red)', 'var(--blue)', 'var(--sun)', 'var(--good)', 'var(--purple)'] as const;
const UNITS = {
  leicht: ['AB', 'AAB', 'ABB'],
  schwer: ['ABC', 'AABB', 'ABCC', 'ABAC'],
};

type Item = { shape: (typeof SHAPES)[number]; color: (typeof COLORS)[number] };
type Question = { shown: Item[]; answer: Item; options: Item[] };

const same = (a: Item, b: Item) => a.shape === b.shape && a.color === b.color;

export function ShapeIcon({ item }: { item: Item }) {
  const common = { fill: item.color, stroke: 'var(--ink)', strokeWidth: 4, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 60 60" className="shape" aria-hidden="true">
      {item.shape === 'circle' && <circle cx="30" cy="30" r="22" {...common} />}
      {item.shape === 'square' && <rect x="9" y="9" width="42" height="42" rx="6" {...common} />}
      {item.shape === 'triangle' && <path d="M30 7 L54 50 L6 50 Z" {...common} />}
      {item.shape === 'star' && <path d="M30 5l7.3 15.6 17 2-12.5 11.7 3.3 16.8L30 42.8 14.9 51.1l3.3-16.8L5.7 22.6l17-2z" {...common} />}
      {item.shape === 'heart' && <path d="M30 52 C10 38 5 28 8 19 C11 10 24 8 30 18 C36 8 49 10 52 19 C55 28 50 38 30 52Z" {...common} />}
    </svg>
  );
}

function makeQuestion(level: keyof typeof UNITS): Question {
  const unit = pick(UNITS[level]);
  const letters = [...new Set(unit)];
  // Easy patterns differ in shape and color; harder ones sometimes only in one of them.
  const mode = level === 'leicht' ? 'both' : pick(['both', 'shape', 'color'] as const);
  const shapes = shuffle([...SHAPES]);
  const colors = shuffle([...COLORS]);
  const itemAt = (i: number): Item =>
    mode === 'both' ? { shape: shapes[i], color: colors[i] } : mode === 'shape' ? { shape: shapes[i], color: colors[0] } : { shape: shapes[0], color: colors[i] };
  const byLetter: Record<string, Item> = {};
  letters.forEach((l, i) => (byLetter[l] = itemAt(i)));
  const length = unit.length * 2 + rnd(0, unit.length - 1) + 1;
  const seq = Array.from({ length }, (_, i) => byLetter[unit[i % unit.length]]);
  const answer = seq.pop()!;
  const distractors = letters.map((l) => byLetter[l]).filter((x) => !same(x, answer));
  for (let i = letters.length; distractors.length < 2; i++) distractors.push(itemAt(i));
  return { shown: seq, answer, options: shuffle([answer, ...shuffle(distractors).slice(0, 2)]) };
}

/** Continue the pattern: which shape comes next? */
export function Muster() {
  const [level, setLevel] = useStored<keyof typeof UNITS>('muster-level', 'leicht');
  const { results, round, score, push } = useRounds(ROUNDS);
  const [q, setQ] = useState(() => makeQuestion(level));
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();
  const text = 'Wie geht das Muster weiter? Was kommt als Nächstes?';

  useEffect(() => say(text), []);

  function changeLevel(l: keyof typeof UNITS) {
    setLevel(l);
    setQ(makeQuestion(l));
    setWrong([]);
    setSolved(false);
  }

  function answer(i: number) {
    if (solved || wrong.includes(i)) return;
    sfx.unlock();
    if (same(q.options[i], q.answer)) {
      sfx.ok();
      setSolved(true);
      say(pick(['Richtig!', 'Super!', 'Genau!']));
      later(() => {
        push(wrong.length === 0);
        if (round + 1 >= ROUNDS) setDone(true);
        else {
          setQ(makeQuestion(level));
          setWrong([]);
          setSolved(false);
        }
      }, 1600);
    } else {
      sfx.bad();
      setWrong((w) => [...w, i]);
      say('Schau nochmal genau.');
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} Mustern beim ersten Versuch richtig.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text} />
      <Settings>
        <Segmented label="Schwierigkeit" options={[['Leicht', 'leicht'], ['Knifflig', 'schwer']]} value={level} onChange={changeLevel} />
      </Settings>
      <div className="pattern">
        {q.shown.map((item, i) => (
          <span key={i} className="pattern-item">
            <ShapeIcon item={item} />
          </span>
        ))}
        <span className={`pattern-item ask${solved ? ' good' : ''}`}>{solved ? <ShapeIcon item={q.answer} /> : '?'}</span>
      </div>
      <div className="answers">
        {q.options.map((item, i) => (
          <button
            key={i}
            type="button"
            className={`ans shape-ans${solved && same(item, q.answer) ? ' good' : ''}${wrong.includes(i) ? ' bad' : ''}`}
            disabled={solved || wrong.includes(i)}
            onClick={() => answer(i)}
            aria-label={`Form ${i + 1}`}
          >
            <ShapeIcon item={item} />
          </button>
        ))}
      </div>
    </Shell>
  );
}
