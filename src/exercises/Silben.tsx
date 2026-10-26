import { useEffect, useState } from 'react';
import { Finish, Progress, Shell, Task } from '../components/exercise';
import { useLater, useRounds } from '../lib/hooks';
import { makeDeck, range } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { syllables, WORDS } from './words';

const ROUNDS = 10;
const POOL = WORDS.filter((w) => syllables(w).length <= 4);

/** Clap the syllables: how many claps does the word have? */
export function Silben() {
  const { results, round, score, push } = useRounds(ROUNDS);
  const [deck] = useState(() => makeDeck(POOL, ROUNDS));
  const [claps, setClaps] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();
  const w = deck[Math.min(round, ROUNDS - 1)];
  const parts = syllables(w);
  const text = `Wie oft klatschst du bei ${w.word}?`;

  useEffect(() => {
    if (!solved) say(text, 'queue');
  }, [text, solved]);

  function clap() {
    sfx.unlock();
    sfx.tick();
    setClaps((c) => (c >= 4 ? 1 : c + 1));
  }

  function speakSlow() {
    parts.forEach((p, i) => say(p, i > 0 ? 'queue' : 'interrupt'));
  }

  function answer(k: number) {
    if (solved || wrong.includes(k)) return;
    sfx.unlock();
    if (k === parts.length) {
      sfx.ok();
      setSolved(true);
      say(`Richtig! ${parts.join(' – ')}. ${k === 1 ? 'Einmal' : `${k} mal`} klatschen.`);
      later(() => {
        push(wrong.length === 0);
        setWrong([]);
        setSolved(false);
        setClaps(0);
        if (round + 1 >= ROUNDS) setDone(true);
      }, 2800);
    } else {
      sfx.bad();
      setWrong((x) => [...x, k]);
      say('Klatsch nochmal mit.');
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} Wörtern beim ersten Versuch richtig geklatscht.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text} />
      <button className="picture" type="button" onClick={speakSlow} aria-label={`${w.word} in Silben vorlesen`}>
        <span className="emoji">{w.emoji}</span>
        <span className="picture-word syl">
          {solved
            ? parts.map((p, i) => (
                <span key={i} className={i % 2 ? 'b' : 'r'}>
                  {p}
                </span>
              ))
            : w.word}
        </span>
      </button>
      <div className="clap-row">
        <button className="btn-soft narrow" type="button" onClick={clap}>
          👏 Mitklatschen
        </button>
        <span className="clap-count" aria-live="polite">
          {claps > 0 ? '👏'.repeat(claps) : ''}
        </span>
      </div>
      <div className="answers">
        {range(1, 4).map((k) => (
          <button
            key={k}
            type="button"
            className={`ans claps${solved && k === parts.length ? ' good' : ''}${wrong.includes(k) ? ' bad' : ''}`}
            disabled={solved || wrong.includes(k)}
            onClick={() => answer(k)}
            aria-label={`${k} mal`}
          >
            <span className="num">{k}</span>
            <span className="dots">{'●'.repeat(k)}</span>
          </button>
        ))}
      </div>
      <p className="hint">Tipp: Aufs Bild tippen, dann wird das Wort langsam in Silben vorgelesen.</p>
    </Shell>
  );
}
