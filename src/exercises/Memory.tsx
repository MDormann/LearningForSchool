import { useEffect, useState } from 'react';
import { Finish, Settings, Shell, Task } from '../components/exercise';
import { Segmented } from '../components/Segmented';
import { useLater } from '../lib/hooks';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { say } from '../lib/speech';
import { useStored } from '../lib/storage';

const THEMES = {
  tiere: ['🐶', '🐱', '🐰', '🦁', '🐸', '🐘', '🐧', '🦒', '🐻', '🐮'],
  essen: ['🍎', '🍌', '🍓', '🥕', '🍉', '🧀', '🥨', '🍋', '🍅', '🥒'],
  sachen: ['🚗', '🚀', '⚽', '🎈', '🧸', '🚲', '☀️', '🌈', '👑', '🎁'],
};
type Prefs = { pairs: 6 | 8 | 10; theme: keyof typeof THEMES };
type Card = { id: number; face: string };

const deal = (p: Prefs): Card[] =>
  shuffle(shuffle(THEMES[p.theme]).slice(0, p.pairs).flatMap((face) => [face, face])).map((face, id) => ({ id, face }));

/** Classic memory: find all pairs. */
export function Memory() {
  const [prefs, setPrefs] = useStored<Prefs>('memory', { pairs: 6, theme: 'tiere' });
  const [cards, setCards] = useState(() => deal(prefs));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const later = useLater();
  const text = 'Finde die Paare! Decke immer zwei Karten auf.';

  useEffect(() => say(text), []);

  function change(p: Prefs) {
    setPrefs(p);
    setCards(deal(p));
    setOpen([]);
    setFound(new Set());
    setMoves(0);
  }

  function flip(i: number) {
    if (open.length >= 2 || open.includes(i) || found.has(cards[i].face)) return;
    sfx.unlock();
    sfx.flip();
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((k) => cards[k]);
    if (a.face === b.face) {
      later(() => {
        sfx.ok();
        const f = new Set(found).add(a.face);
        setFound(f);
        setOpen([]);
        if (f.size === prefs.pairs) later(() => setDone(true), 700);
      }, 400);
    } else {
      later(() => setOpen([]), 1100);
    }
  }

  if (done) {
    const perfect = prefs.pairs;
    const stars = moves <= perfect * 1.5 ? 3 : moves <= perfect * 2.2 ? 2 : 1;
    return (
      <Shell>
        <Finish message={`Alle ${prefs.pairs} Paare gefunden – mit ${moves} Zügen.`} stars={stars} />
      </Shell>
    );
  }

  return (
    <Shell progress={<p className="memory-status">Paare: {found.size} von {prefs.pairs} · Züge: {moves}</p>}>
      <Task text={text} />
      <Settings>
        <Segmented label="Paare" options={[['6 Paare', 6], ['8 Paare', 8], ['10 Paare', 10]]} value={prefs.pairs} onChange={(pairs) => change({ ...prefs, pairs })} />
        <Segmented label="Bilder" options={[['Tiere', 'tiere'], ['Essen', 'essen'], ['Sachen', 'sachen']]} value={prefs.theme} onChange={(theme) => change({ ...prefs, theme })} />
      </Settings>
      <div className={`memory-grid p${prefs.pairs}`}>
        {cards.map((c, i) => {
          const isFound = found.has(c.face);
          const isOpen = open.includes(i) || isFound;
          return (
            <button
              key={c.id}
              type="button"
              className={`memory-card${isOpen ? ' open' : ''}${isFound ? ' found' : ''}`}
              onClick={() => flip(i)}
              aria-label={isOpen ? c.face : 'verdeckte Karte'}
            >
              <span className="memory-inner">
                <span className="memory-back" />
                <span className="memory-face">{c.face}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
