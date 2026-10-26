import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useApp } from '../lib/app';
import { goTo } from '../lib/route';
import { sfx } from '../lib/sound';
import { say, stopSpeaking } from '../lib/speech';
import { BackIcon, SpeakerIcon, StarIcon } from './icons';

type ExerciseCtx = { id: string; title: string; restart: () => void };
export const ExerciseContext = createContext<ExerciseCtx>({ id: '', title: '', restart: () => {} });

/** Stars earned in the current exercise. */
export function useEarn() {
  const { id } = useContext(ExerciseContext);
  const { addStars } = useApp();
  return useCallback((n: number) => addStars(id, n), [addStars, id]);
}

export function Progress({ total, results }: { total: number; results: boolean[] }) {
  return (
    <div className="progress" aria-label={`${results.length} von ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={results[i] === true ? 'done' : results[i] === false ? 'miss' : ''} />
      ))}
    </div>
  );
}

/** Frame around every exercise: back button, title, progress dots, star counter. */
export function Shell({ children, progress }: { children: ReactNode; progress?: ReactNode }) {
  const { title, id } = useContext(ExerciseContext);
  const { stars } = useApp();
  useEffect(() => () => stopSpeaking(), []);
  return (
    <div className="screen">
      <header className="ex-bar">
        <button className="icon-btn" type="button" aria-label="Zur Übersicht" onClick={() => goTo(null)}>
          <BackIcon />
        </button>
        <h1 className="ex-title">{title}</h1>
        <span className="star-count" title="Sterne in dieser Übung">
          <StarIcon size={24} /> {stars[id] ?? 0}
        </span>
      </header>
      {progress && <div className="ex-progress">{progress}</div>}
      <main className="stage">{children}</main>
    </div>
  );
}

export function Task({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="task-row">
      <p className="task">{children ?? text}</p>
      <button className="icon-btn" type="button" aria-label="Nochmal vorlesen" onClick={() => say(text)}>
        <SpeakerIcon />
      </button>
    </div>
  );
}

export function Settings({ children }: { children: ReactNode }) {
  return <div className="settings-row">{children}</div>;
}

/** End screen with stars, praise and "again" / "other exercise" buttons. Credits the earned stars once. */
export function Finish({ message, stars, maxStars = 3 }: { message: string; stars: number; maxStars?: number }) {
  const { restart } = useContext(ExerciseContext);
  const earn = useEarn();
  const credited = useRef(false);
  useEffect(() => {
    if (credited.current) return;
    credited.current = true;
    earn(stars);
  }, [earn, stars]);
  const shown = Math.max(0, Math.min(3, Math.round((stars / maxStars) * 3)));
  const title = shown >= 3 ? 'Super gemacht!' : shown === 2 ? 'Toll gemacht!' : 'Geschafft!';
  useEffect(() => {
    sfx.win();
    say(`${title} ${message}`, 'queue');
  }, [title, message]);
  return (
    <div className="finish card">
      <div className="finish-stars">
        {[0, 1, 2].map((i) => (
          <StarIcon key={i} on={i < Math.max(1, shown)} />
        ))}
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      <p className="earned">{stars === 1 ? '+1 Stern' : `+${stars} Sterne`}</p>
      <div className="finish-actions">
        <button className="btn-big" type="button" onClick={restart}>
          Nochmal!
        </button>
        <button className="btn-soft" type="button" onClick={() => goTo(null)}>
          Andere Übung
        </button>
      </div>
    </div>
  );
}
