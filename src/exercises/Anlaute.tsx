import { useEffect, useState } from 'react';
import { Finish, Progress, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater, useRounds } from '../lib/hooks';
import { makeDeck, shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';
import { initial, WORDS, type Word } from './words';

const ROUNDS = 10;
const POOL = WORDS.filter((w) => !w.noInitial);

type Mode = 'letter' | 'picture';
type Question = { target: Word; options: Word[] };

/** Three answer words with different first letters, one of which is the target. */
function makeQuestions(): Question[] {
  return makeDeck(POOL, ROUNDS).map((target) => {
    const others = shuffle(POOL.filter((w) => initial(w) !== initial(target)));
    const options: Word[] = [target];
    for (const w of others) {
      if (options.length >= 3) break;
      if (!options.some((o) => initial(o) === initial(w))) options.push(w);
    }
    return { target, options: shuffle(options) };
  });
}

const letterLabel = (w: Word) => `${initial(w)} ${initial(w).toLowerCase()}`;

/** First sounds: which letter does the picture start with – or which picture starts with the letter? */
export function Anlaute() {
  const [mode, setMode] = useStored<Mode>('anlaute-mode', 'letter');
  const { results, round, score, push } = useRounds(ROUNDS);
  const [questions, setQuestions] = useState(makeQuestions);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const later = useLater();
  const q = questions[Math.min(round, ROUNDS - 1)];
  const t = q.target;
  const text = mode === 'letter' ? `Womit fängt ${t.word} an?` : `Welches Bild fängt mit ${initial(t)} an?`;

  useEffect(() => {
    if (!solved) say(text, 'queue');
  }, [text, solved]);

  function changeMode(m: Mode) {
    setMode(m);
    setWrong([]);
    setSolved(false);
    setQuestions(makeQuestions());
  }

  function answer(w: Word) {
    if (solved || wrong.includes(w.word)) return;
    sfx.unlock();
    if (initial(w) === initial(t)) {
      sfx.ok();
      setSolved(true);
      say(`Richtig! ${t.word} fängt mit ${initial(t)} an.`);
      later(() => {
        push(wrong.length === 0);
        setWrong([]);
        setSolved(false);
        if (round + 1 >= ROUNDS) setDone(true);
      }, 2200);
    } else {
      sfx.bad();
      setWrong((x) => [...x, w.word]);
      say(mode === 'letter' ? 'Hör nochmal genau hin.' : `${w.word} fängt mit ${initial(w)} an. Versuch es nochmal.`);
    }
  }

  if (done) {
    return (
      <Shell>
        <Finish message={`${score} von ${ROUNDS} Anlauten beim ersten Versuch erkannt.`} stars={Math.round((score / ROUNDS) * 3)} />
      </Shell>
    );
  }

  const cls = (w: Word) => `${solved && w === t ? ' good' : ''}${wrong.includes(w.word) ? ' bad' : ''}`;

  return (
    <Shell progress={<Progress total={ROUNDS} results={results} />}>
      <Task text={text} />
      <Settings>
        <Segmented label="Aufgabe" options={[['Bild → Buchstabe', 'letter'], ['Buchstabe → Bild', 'picture']]} value={mode} onChange={changeMode} />
      </Settings>
      {mode === 'letter' ? (
        <>
          <button className="picture" type="button" onClick={() => say(t.word)} aria-label={`${t.word} vorlesen`}>
            <span className="emoji">{t.emoji}</span>
            <span className="picture-word">{solved ? t.word : ' '}</span>
          </button>
          <div className="answers">
            {q.options.map((w) => (
              <button key={w.word} type="button" className={`ans letter${cls(w)}`} disabled={solved || wrong.includes(w.word)} onClick={() => answer(w)}>
                {letterLabel(w)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="big-letter" aria-label={`Buchstabe ${initial(t)}`}>
            {letterLabel(t)}
          </div>
          <div className="picture-choices">
            {q.options.map((w) => (
              <button key={w.word} type="button" className={`picture small${cls(w)}`} disabled={solved || wrong.includes(w.word)} onClick={() => answer(w)} aria-label={w.word}>
                <span className="emoji">{w.emoji}</span>
                <span className="picture-word">{solved || wrong.includes(w.word) ? w.word : ' '}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {mode === 'letter' && <p className="hint">Tipp: Aufs Bild tippen, dann wird das Wort vorgelesen.</p>}
    </Shell>
  );
}
