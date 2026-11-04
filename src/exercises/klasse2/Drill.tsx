import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Finish, Progress, Settings, Shell } from '../../components/exercise';
import { SpeakerIcon } from '../../components/icons';
import { useLater } from '../../lib/hooks';
import { sfx } from '../../lib/sound';
import { say } from '../../lib/speech';
import { load, save } from '../../lib/storage';
import { shuffle } from '../../lib/random';
import { answerOf, hint, spoken, taskKey, type CalcTask } from './tasks';

const MAX_DIGITS = 3;
const SIGN: Record<CalcTask['op'], string> = { '+': '+', '-': '−', '·': '·', ':': ':' };

export const fmtTime = (ms: number) => (Math.max(0, ms) / 1000).toFixed(1).replace('.', ',') + ' s';
const show = (t: CalcTask) => `${t.a} ${SIGN[t.op]} ${t.b} = ${t.result}`;

type Props = {
  /** Builds a fresh list of tasks from the current settings. */
  makeTasks: () => CalcTask[];
  /** Setting controls shown above the task; changing a setting changes `settingsKey`, which restarts the round. */
  settings: ReactNode;
  settingsKey: string;
  /** Rechenolympiade: start button, stopwatch and best time per settings. */
  timed?: boolean;
  intro: string;
};

type Phase = 'ready' | 'play' | 'done';

/** Shared engine for the arithmetic exercises: type the answer on a number pad, get help after a mistake. */
export function Drill({ makeTasks, settings, settingsKey, timed = false, intro }: Props) {
  const [phase, setPhase] = useState<Phase>(timed ? 'ready' : 'play');
  const [tasks, setTasks] = useState<CalcTask[]>(makeTasks);
  const [practice, setPractice] = useState(false);
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<'idle' | 'ok' | 'reveal'>('idle');
  const [shake, setShake] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [missed, setMissed] = useState<CalcTask[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [record, setRecord] = useState<{ total: number; prev: number | null; isNew: boolean } | null>(null);
  const start = useRef(0);
  const later = useLater();
  const t = tasks[i];
  const bestKey = `drill-best-${settingsKey}`;

  const reset = useCallback(
    (list: CalcTask[], asPractice: boolean) => {
      setTasks(list);
      setPractice(asPractice);
      setI(0);
      setInput('');
      setTries(0);
      setState('idle');
      setResults([]);
      setMissed([]);
      setElapsed(0);
      setRecord(null);
      setPhase(timed && !asPractice ? 'ready' : 'play');
      start.current = performance.now();
    },
    [timed],
  );

  // A changed setting starts a new round with matching tasks.
  const firstKey = useRef(settingsKey);
  useEffect(() => {
    if (firstKey.current === settingsKey) return;
    firstKey.current = settingsKey;
    reset(makeTasks(), false);
  }, [settingsKey, makeTasks, reset]);

  // Stopwatch.
  useEffect(() => {
    if (!timed || phase !== 'play' || practice) return;
    let raf = 0;
    const tick = () => {
      setElapsed(performance.now() - start.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timed, phase, practice]);

  function go() {
    sfx.unlock();
    sfx.go();
    start.current = performance.now();
    setPhase('play');
  }

  function advance(ok: boolean) {
    setResults((r) => [...r, ok]);
    if (i + 1 >= tasks.length) {
      finish();
      return;
    }
    setI(i + 1);
    setInput('');
    setTries(0);
    setState('idle');
  }

  function finish() {
    const total = performance.now() - start.current;
    if (timed && !practice) {
      const prev = load<number | null>(bestKey, null);
      const isNew = prev == null || total < prev;
      if (isNew) save(bestKey, Math.round(total));
      setRecord({ total, prev, isNew });
    }
    setPhase('done');
  }

  function submit() {
    if (phase !== 'play' || state !== 'idle' || input === '') return;
    sfx.unlock();
    if (Number(input) === answerOf(t)) {
      sfx.ok();
      setState('ok');
      later(() => advance(tries === 0), timed ? 350 : 650);
      return;
    }
    sfx.bad();
    setShake((s) => s + 1);
    setInput('');
    if (tries === 0) setMissed((m) => (m.some((x) => taskKey(x) === taskKey(t)) ? m : [...m, t]));
    if (tries >= 1) {
      // Second mistake: show the solution, then move on.
      setState('reveal');
      later(() => advance(false), 2600);
    }
    setTries(tries + 1);
  }

  function type(d: string) {
    if (phase !== 'play' || state !== 'idle') return;
    sfx.unlock();
    setInput((x) => (x.length >= MAX_DIGITS ? x : x === '0' ? d : x + d));
  }
  const del = () => state === 'idle' && setInput((x) => x.slice(0, -1));

  // Keyboard: digits, Backspace, Enter.
  const keyRef = useRef({ type, del, submit, phase, go });
  keyRef.current = { type, del, submit, phase, go };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const k = keyRef.current;
      if (/^[0-9]$/.test(e.key)) k.type(e.key);
      else if (e.key === 'Backspace') k.del();
      else if (e.key === 'Enter') {
        if (k.phase === 'ready') k.go();
        else k.submit();
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  if (phase === 'done') {
    const firstTry = results.filter(Boolean).length;
    const mistakes = tasks.length - firstTry;
    let message: string;
    let stars: number;
    if (timed && record) {
      stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      message =
        `${tasks.length} Aufgaben in ${fmtTime(record.total)}, ${mistakes === 0 ? 'ohne Fehler!' : `${mistakes} Fehler.`}` +
        (record.isNew ? (record.prev == null ? ' Erste Bestzeit!' : ' Neuer Rekord!') : ` Bestzeit: ${fmtTime(record.prev!)}.`);
    } else {
      stars = Math.round((firstTry / tasks.length) * 3);
      message = `${firstTry} von ${tasks.length} beim ersten Versuch richtig.`;
    }
    return (
      <Shell>
        <Finish message={message} stars={stars} />
        {missed.length > 0 && (
          <div className="card missed">
            <h2>Diese Aufgaben üben wir nochmal</h2>
            <ul>
              {missed.map((m) => (
                <li key={taskKey(m)}>{show(m)}</li>
              ))}
            </ul>
            <button className="btn-soft" type="button" onClick={() => reset(shuffle([...missed, ...missed]), true)}>
              Fehleraufgaben üben
            </button>
          </div>
        )}
      </Shell>
    );
  }

  const help = tries > 0 ? hint(t) : null;
  const cell = (k: 'a' | 'b' | 'result') => {
    if (t.gap !== k) return <span className="eq-num">{t[k]}</span>;
    const shown = state === 'reveal' ? String(answerOf(t)) : input;
    return (
      <span className={`eq-gap${state === 'ok' ? ' ok' : ''}${state === 'reveal' ? ' reveal' : ''}`} aria-live="polite">
        {shown || ' '}
      </span>
    );
  };

  return (
    <Shell
      progress={
        timed && !practice ? (
          <div className="timebar">
            <div className="bar-track" aria-hidden="true">
              <i style={{ width: `${(i / tasks.length) * 100}%` }} />
            </div>
            <span className="clock">{fmtTime(elapsed)}</span>
          </div>
        ) : tasks.length <= 20 ? (
          <Progress total={tasks.length} results={results} />
        ) : (
          <p className="memory-status">
            Aufgabe {i + 1} von {tasks.length}
          </p>
        )
      }
    >
      {practice && <p className="practice-badge">Übungsrunde mit deinen Fehleraufgaben</p>}
      {/* Against the clock only the task is shown; settings stay on the start card. */}
      {!practice && (!timed || phase === 'ready') && <Settings>{settings}</Settings>}
      {phase === 'ready' ? (
        <div className="card olympia-start">
          <p>{intro}</p>
          {(() => {
            const best = load<number | null>(bestKey, null);
            return <p className="hint">{best != null ? `Deine Bestzeit mit diesen Einstellungen: ${fmtTime(best)}` : 'Noch keine Bestzeit mit diesen Einstellungen.'}</p>;
          })()}
          <button className="btn-big" type="button" onClick={go}>
            Los geht's!
          </button>
        </div>
      ) : (
        <>
          <div className={`equation${shake ? ` shake-${shake % 2}` : ''}`} key={i}>
            {cell('a')}
            <span className="eq-op">{SIGN[t.op]}</span>
            {cell('b')}
            <span className="eq-op">=</span>
            {cell('result')}
            <button className="icon-btn eq-speak" type="button" aria-label="Aufgabe vorlesen" onClick={() => say(spoken(t))}>
              <SpeakerIcon />
            </button>
          </div>
          <div className="help-box" aria-live="polite">
            {state === 'reveal' ? (
              <p>
                <b>So geht's:</b> {show(t)}
              </p>
            ) : help ? (
              help.map((line, k) => <p key={k}>{line}</p>)
            ) : tries > 0 ? (
              <p>Nicht ganz – probier es nochmal!</p>
            ) : null}
          </div>
          <div className="numpad" role="group" aria-label="Zahlenfeld">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} type="button" className="key" onClick={() => type(d)}>
                {d}
              </button>
            ))}
            <button type="button" className="key del" onClick={del} aria-label="Löschen">
              ⌫
            </button>
            <button type="button" className="key" onClick={() => type('0')}>
              0
            </button>
            <button type="button" className="key ok" onClick={submit} aria-label="Prüfen">
              ✓
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}
