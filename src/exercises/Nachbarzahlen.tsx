import { useEffect, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { ArrowIcon } from '../components/icons';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { chainColor, range, rnd, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const ROUNDS = 10;

type Prefs = { dir: 'nach' | 'vor' | 'mix'; max: 10 | 20; line: boolean };
type Question = { n: number; dir: 1 | -1; options: number[] };

function makeQuestion(prefs: Prefs, lastN: number): Question {
  const dir: 1 | -1 = prefs.dir === 'nach' ? 1 : prefs.dir === 'vor' ? -1 : Math.random() < 0.5 ? 1 : -1;
  let n: number;
  do n = dir > 0 ? rnd(1, prefs.max - 1) : rnd(2, prefs.max);
  while (n === lastN);
  const ans = n + dir;
  const pool = [...new Set([n, ans + dir, n - dir, ans + 2 * dir, ans - 2 * dir, ans + 3, ans - 3])].filter(
    (x) => x >= 1 && x <= prefs.max && x !== ans,
  );
  const options = [ans, ...shuffle(pool).slice(0, 3)].sort((a, b) => a - b);
  return { n, dir, options };
}

const questionText = (q: Question) => (q.dir > 0 ? `Welche Zahl kommt nach der ${q.n}?` : `Welche Zahl kommt vor der ${q.n}?`);

/** Predecessor / successor: which number comes right before or after? */
export function Nachbarzahlen() {
  const [prefs, setPrefs] = useStored<Prefs>('nachbarn', { dir: 'nach', max: 10, line: false });
  const { results, round, score, push } = useRounds(ROUNDS);
  const [q, setQ] = useState<Question>(() => makeQuestion(prefs, 0));
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();
  const ans = q.n + q.dir;
  const text = questionText(q);

  useEffect(() => say(text), [text]);

  function changePrefs(p: Prefs) {
    setPrefs(p);
    if (p.dir !== prefs.dir || p.max !== prefs.max) {
      setQ(makeQuestion(p, q.n));
      setWrong([]);
      setSolved(false);
    }
  }

  function answer(k: number) {
    if (solved || wrong.includes(k)) return;
    sfx.unlock();
    if (k === ans) {
      sfx.ok();
      setSolved(true);
      push(wrong.length === 0);
      say(q.dir > 0 ? `Richtig! Nach der ${q.n} kommt die ${ans}.` : `Richtig! Vor der ${q.n} kommt die ${ans}.`);
      later(() => {
        if (round + 1 >= ROUNDS) setDone(true);
        else {
          setQ(makeQuestion(prefs, q.n));
          setWrong([]);
          setSolved(false);
        }
      }, 2200);
    } else {
      sfx.bad();
      setWrong((w) => [...w, k]);
      say('Versuch es nochmal.');
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} beim ersten Versuch richtig.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  const known = <div className={`box known ${chainColor(q.n)}`}>{q.n}</div>;
  const ask = <div className={`box ask${solved ? ' good' : ''}`}>{solved ? ans : '?'}</div>;

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text} />
      <Settings>
        <Segmented label="Richtung" options={[['danach', 'nach'], ['davor', 'vor'], ['gemischt', 'mix']]} value={prefs.dir} onChange={(dir) => changePrefs({ ...prefs, dir })} />
        <Segmented label="Zahlenraum" options={[['bis 10', 10], ['bis 20', 20]]} value={prefs.max} onChange={(max) => changePrefs({ ...prefs, max })} />
      </Settings>
      <div className="pair">
        {q.dir > 0 ? known : ask}
        <ArrowIcon />
        {q.dir > 0 ? ask : known}
      </div>
      <div className="answers">
        {q.options.map((k) => (
          <button
            key={k}
            type="button"
            className={`ans${solved && k === ans ? ' good' : ''}${wrong.includes(k) ? ' bad' : ''}`}
            disabled={solved || wrong.includes(k)}
            onClick={() => answer(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <button className="btn-soft narrow" type="button" aria-pressed={prefs.line} onClick={() => changePrefs({ ...prefs, line: !prefs.line })}>
        {prefs.line ? 'Zahlenstrahl ausblenden' : 'Zahlenstrahl zeigen'}
      </button>
      {prefs.line && (
        <div className={`numline${prefs.max > 10 ? ' long' : ''}`} aria-label="Zahlenstrahl">
          {range(1, prefs.max).map((i) => (
            <span key={i} className={i === q.n ? 'on' : i === ans ? 'q' : ''}>
              {i === ans && !solved ? '?' : i}
            </span>
          ))}
        </div>
      )}
    </Shell>
  );
}
