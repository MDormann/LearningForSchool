import { useEffect, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { makeDeck, pick, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const ROUNDS = 10;

type Prep = 'auf' | 'unter' | 'neben' | 'hinter' | 'vor' | 'in';
type RefKey = 'tisch' | 'kiste' | 'korb';
type Thing = { name: string; article: 'Der' | 'Die'; emoji: string };
type Scene = { prep: Prep; ref: RefKey; thing: Thing };

const PREPS_EASY: Prep[] = ['auf', 'unter', 'neben', 'in'];
const PREPS_ALL: Prep[] = ['auf', 'unter', 'neben', 'hinter', 'vor', 'in'];

const THINGS: Thing[] = [
  { name: 'Ball', article: 'Der', emoji: '⚽' },
  { name: 'Katze', article: 'Die', emoji: '🐱' },
  { name: 'Hund', article: 'Der', emoji: '🐶' },
  { name: 'Teddy', article: 'Der', emoji: '🧸' },
  { name: 'Maus', article: 'Die', emoji: '🐭' },
  { name: 'Ente', article: 'Die', emoji: '🦆' },
];

/** Reference objects in the dative, and which positions each one can show unambiguously. */
const REFS: Record<RefKey, { dative: string; preps: Prep[] }> = {
  tisch: { dative: 'dem Tisch', preps: ['auf', 'unter', 'neben'] },
  kiste: { dative: 'der Kiste', preps: ['auf', 'neben', 'hinter', 'vor'] },
  korb: { dative: 'dem Korb', preps: ['in', 'neben'] },
};

const refsFor = (prep: Prep) => (Object.keys(REFS) as RefKey[]).filter((r) => REFS[r].preps.includes(prep));
/** "in dem" contracts to "im". */
const place = (s: Scene) => `${s.prep} ${REFS[s.ref].dative}`.replace(/^in dem /, 'im ');
const sentence = (s: Scene) => `${s.thing.article} ${s.thing.name} ist ${place(s)}.`;
const where = (t: Thing) => `Wo ist ${t.article.toLowerCase()} ${t.name}?`;

function makeScene(prep: Prep, thing: Thing): Scene {
  return { prep, ref: pick(refsFor(prep)), thing };
}

// ---------- Drawing ----------

const INK = 'var(--ink)';

function Item({ thing, x, y, size }: { thing: Thing; x: number; y: number; size: number }) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor="middle" className="scene-emoji">
      {thing.emoji}
    </text>
  );
}

/** Where the thing goes for each reference + position: x, emoji baseline y, font size. */
const POS: Record<RefKey, Partial<Record<Prep, [number, number, number]>>> = {
  tisch: { auf: [100, 70, 36], unter: [100, 128, 34], neben: [172, 128, 36] },
  kiste: { auf: [100, 70, 36], neben: [170, 128, 36], hinter: [118, 80, 34], vor: [96, 146, 44] },
  korb: { in: [100, 108, 36], neben: [170, 128, 36] },
};

export function SceneSvg({ scene }: { scene: Scene }) {
  const [x, y, size] = POS[scene.ref][scene.prep]!;
  const item = <Item thing={scene.thing} x={x} y={y} size={size} />;
  const behind = scene.prep === 'hinter' || scene.prep === 'in';
  return (
    <svg viewBox="10 26 186 124" className="scene" role="img" aria-label={sentence(scene)}>
      <rect x="0" y="132" width="200" height="18" fill="#cfe6c4" />
      <line x1="0" y1="132" x2="200" y2="132" stroke={INK} strokeWidth="2" />
      {scene.ref === 'korb' && <ellipse cx="100" cy="94" rx="38" ry="9" fill="#7a4d24" stroke={INK} strokeWidth="3" />}
      {behind && item}
      {scene.ref === 'tisch' && (
        <g stroke={INK} strokeWidth="3" fill="#c48a4f">
          <rect x="62" y="80" width="8" height="52" rx="2" />
          <rect x="130" y="80" width="8" height="52" rx="2" />
          <rect x="52" y="70" width="96" height="11" rx="3" />
        </g>
      )}
      {scene.ref === 'kiste' && (
        <g stroke={INK} strokeWidth="3">
          <rect x="64" y="72" width="72" height="60" rx="3" fill="#e0aa5e" />
          <path d="M64 92h72M64 112h72" strokeWidth="2" fill="none" opacity="0.5" />
        </g>
      )}
      {scene.ref === 'korb' && (
        <g stroke={INK} strokeWidth="3">
          <path d="M62 94 Q64 132 74 132 H126 Q136 132 138 94 Q100 108 62 94Z" fill="#d79a52" />
          <path d="M70 108 Q100 118 130 108M74 121 Q100 129 126 121" strokeWidth="2" fill="none" opacity="0.6" />
        </g>
      )}
      {!behind && item}
    </svg>
  );
}

/** Tiny pictogram for a position word: grey block, red dot. */
function PrepIcon({ prep }: { prep: Prep }) {
  const dot: Record<Prep, [number, number, number]> = {
    auf: [20, 9, 6],
    unter: [20, 35, 5],
    neben: [35, 26, 6],
    hinter: [25, 13, 5],
    vor: [17, 32, 8],
    in: [20, 24, 5],
  };
  const [cx, cy, r] = dot[prep];
  const box =
    prep === 'unter' ? (
      <path d="M6 15h28M9 15v24M31 15v24" stroke={INK} strokeWidth="3" fill="none" />
    ) : prep === 'in' ? (
      <path d="M8 16v18h24V16" stroke={INK} strokeWidth="3" fill="#d9d9d9" />
    ) : (
      <rect x={prep === 'neben' ? 4 : 8} y="15" width="24" height="22" rx="2" fill="#d9d9d9" stroke={INK} strokeWidth="3" />
    );
  const dotEl = <circle cx={cx} cy={cy} r={r} fill="var(--red)" stroke={INK} strokeWidth="2" />;
  return (
    <svg viewBox="0 0 40 40" className="prep-icon" aria-hidden="true">
      {prep === 'hinter' || prep === 'in' ? (
        <>
          {dotEl}
          {box}
        </>
      ) : (
        <>
          {box}
          {dotEl}
        </>
      )}
    </svg>
  );
}

// ---------- Exercise ----------

type Mode = 'bild' | 'wort';
type Prefs = { mode: Mode; level: 'leicht' | 'alle' };
type Question = { target: Scene; options: Scene[]; words: Prep[] };

function makeQuestions(prefs: Prefs): Question[] {
  const preps = prefs.level === 'leicht' ? PREPS_EASY : PREPS_ALL;
  return makeDeck(preps, ROUNDS).map((prep) => {
    const thing = pick(THINGS);
    const target = makeScene(prep, thing);
    const others = shuffle(preps.filter((p) => p !== prep)).slice(0, 2);
    return {
      target,
      options: shuffle([target, ...others.map((p) => makeScene(p, thing))]),
      words: preps,
    };
  });
}

/** Position words: on, under, next to, behind, in front of, in. */
export function Lagewoerter() {
  const [prefs, setPrefs] = useStored<Prefs>('lagewoerter', { mode: 'bild', level: 'leicht' });
  const { results, round, score, push } = useRounds(ROUNDS);
  const [questions, setQuestions] = useState(() => makeQuestions(prefs));
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();
  const q = questions[Math.min(round, ROUNDS - 1)];
  const t = q.target;
  const text = prefs.mode === 'bild' ? `Zeig mir: ${sentence(t)}` : where(t.thing);

  useEffect(() => {
    if (!solved) say(text);
  }, [text, solved]);

  function change(p: Prefs) {
    setPrefs(p);
    setQuestions(makeQuestions(p));
    setWrong([]);
    setSolved(false);
  }

  function answer(prep: Prep, key: string, shown: Scene) {
    if (solved || wrong.includes(key)) return;
    sfx.unlock();
    if (prep === t.prep) {
      sfx.ok();
      setSolved(true);
      say(`Richtig! ${sentence(t)}`);
      later(() => {
        push(wrong.length === 0);
        setWrong([]);
        setSolved(false);
        if (round + 1 >= ROUNDS) setDone(true);
      }, 2400);
    } else {
      sfx.bad();
      setWrong((w) => [...w, key]);
      say(prefs.mode === 'bild' ? `Hier ist es so: ${sentence(shown)} Versuch es nochmal.` : `Nein, nicht ${prep}. Schau nochmal genau.`);
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} beim ersten Versuch richtig.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text}>
        {prefs.mode === 'bild' ? (
          <>
            {t.thing.article} {t.thing.name} ist <mark className="prep-word">{place(t).split(' ')[0]}</mark> {place(t).split(' ').slice(1).join(' ')}.
          </>
        ) : (
          where(t.thing)
        )}
      </Task>
      <Settings>
        <Segmented label="Aufgabe" options={[['Bild finden', 'bild'], ['Wort finden', 'wort']]} value={prefs.mode} onChange={(mode) => change({ ...prefs, mode })} />
        <Segmented label="Wörter" options={[['4 Wörter', 'leicht'], ['alle 6', 'alle']]} value={prefs.level} onChange={(level) => change({ ...prefs, level })} />
      </Settings>
      {prefs.mode === 'bild' ? (
        <div className="scene-choices">
          {q.options.map((s, i) => {
            const key = `${i}`;
            const isGood = solved && s === t;
            return (
              <button
                key={key}
                type="button"
                className={`scene-btn${isGood ? ' good' : ''}${wrong.includes(key) ? ' bad' : ''}`}
                disabled={solved || wrong.includes(key)}
                onClick={() => answer(s.prep, key, s)}
              >
                <SceneSvg scene={s} />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <button className="scene-btn big" type="button" onClick={() => say(where(t.thing))} aria-label={where(t.thing)}>
            <SceneSvg scene={t} />
          </button>
          <div className="answers">
            {q.words.map((p) => (
              <button
                key={p}
                type="button"
                className={`ans prep${solved && p === t.prep ? ' good' : ''}${wrong.includes(p) ? ' bad' : ''}`}
                disabled={solved || wrong.includes(p)}
                onClick={() => answer(p, p, t)}
              >
                <PrepIcon prep={p} />
                <span>{p}</span>
              </button>
            ))}
          </div>
          {solved && <p className="status good">{sentence(t)}</p>}
        </>
      )}
    </Shell>
  );
}
