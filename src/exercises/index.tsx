import type { ComponentType, ReactNode } from 'react';
import { Anlaute } from './Anlaute';
import { Ballblitz } from './Ballblitz';
import { Memory } from './Memory';
import { Muster } from './Muster';
import { Nachbarzahlen } from './Nachbarzahlen';
import { Silben } from './Silben';
import { Wuerfelblick } from './Wuerfelblick';
import { Zaehlen } from './Zaehlen';
import { Zehnerfeld } from './Zehnerfeld';

export type Category = 'zahlen' | 'sprache' | 'knobeln';

export type Exercise = {
  id: string;
  title: string;
  description: string;
  category: Category;
  /** Small picture shown on the home card. */
  preview: ReactNode;
  component: ComponentType;
};

export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: 'zahlen', title: 'Zahlen', blurb: 'Zählen, Mengen sehen, Zahlen ordnen' },
  { id: 'sprache', title: 'Buchstaben & Wörter', blurb: 'Anlaute hören, Silben klatschen' },
  { id: 'knobeln', title: 'Knobeln', blurb: 'Muster erkennen, Paare merken' },
];

const Chips = ({ items }: { items: (string | number)[] }) => (
  <span className="mini">
    {items.map((x, i) =>
      x === '…' ? (
        <i key={i}>…</i>
      ) : (
        <b key={i} className={typeof x === 'number' ? ((x - 1) % 10 < 5 ? 'r' : 'bl') : ''}>
          {x}
        </b>
      ),
    )}
  </span>
);

/**
 * All exercises. To add a new one: create a component in this folder that renders <Shell> and <Finish>,
 * then add an entry here – the home screen and routing pick it up automatically.
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'zaehlen',
    title: 'Zählen bis 20',
    description: 'Die Zahlen von 1 bis 20 der Reihe nach antippen.',
    category: 'zahlen',
    preview: <Chips items={[1, '…', 20]} />,
    component: () => <Zaehlen from={1} to={20} />,
  },
  {
    id: 'countdown',
    title: 'Countdown',
    description: 'Rückwärts von 10 bis 1 zählen – dann startet die Rakete.',
    category: 'zahlen',
    preview: <Chips items={[10, '…', 1]} />,
    component: () => <Zaehlen from={10} to={1} />,
  },
  {
    id: 'wuerfelblick',
    title: 'Würfelblick',
    description: 'Punkte kurz anschauen und sagen, wie viele es waren – ohne zu zählen.',
    category: 'zahlen',
    preview: (
      <span className="mini">
        <span className="minidice">
          {[[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]].map(([x, y], i) => (
            <span key={i} style={{ left: `${x}%`, top: `${y}%` }} />
          ))}
        </span>
        <b>5</b>
      </span>
    ),
    component: Wuerfelblick,
  },
  {
    id: 'zehnerfeld',
    title: 'Zehnerfeld-Blitz',
    description: 'Wie viele Kästchen sind ausgemalt? So schnell wie möglich antippen.',
    category: 'zahlen',
    preview: (
      <span className="mini">
        <span className="miniframe">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < 5 ? 'r' : i < 7 ? 'b' : ''} />
          ))}
        </span>
        <b>7</b>
      </span>
    ),
    component: Zehnerfeld,
  },
  {
    id: 'nachbarzahlen',
    title: 'Nachbarzahlen',
    description: 'Welche Zahl kommt davor, welche danach?',
    category: 'zahlen',
    preview: <Chips items={[6, '?']} />,
    component: Nachbarzahlen,
  },
  {
    id: 'ballblitz',
    title: 'Ballblitz',
    description: 'Wovon sind es mehr? Bälle ganz kurz anschauen und schätzen.',
    category: 'zahlen',
    preview: (
      <span className="mini balls">
        <span style={{ background: '#E5383B' }} />
        <span style={{ background: '#2DA84F' }} />
        <span style={{ background: '#E5383B' }} />
        <span style={{ background: '#E5383B' }} />
        <span style={{ background: '#2DA84F' }} />
      </span>
    ),
    component: Ballblitz,
  },
  {
    id: 'anlaute',
    title: 'Anlaute',
    description: 'Womit fängt das Wort an? Bild und Buchstabe zusammenbringen.',
    category: 'sprache',
    preview: (
      <span className="mini">
        <span className="mini-emoji">🐭</span>
        <b>M</b>
      </span>
    ),
    component: Anlaute,
  },
  {
    id: 'silben',
    title: 'Silben klatschen',
    description: 'Wie oft klatschst du bei einem Wort? Ba – na – ne!',
    category: 'sprache',
    preview: (
      <span className="mini">
        <span className="mini-emoji">🍌</span>
        <span className="mini-emoji">👏👏👏</span>
      </span>
    ),
    component: Silben,
  },
  {
    id: 'muster',
    title: 'Muster legen',
    description: 'Wie geht die Reihe weiter? Formen und Farben erkennen.',
    category: 'knobeln',
    preview: (
      <span className="mini shapes">
        <span className="c r" />
        <span className="q b" />
        <span className="c r" />
        <span className="q b" />
        <b>?</b>
      </span>
    ),
    component: Muster,
  },
  {
    id: 'memory',
    title: 'Memory',
    description: 'Karten aufdecken und Paare finden.',
    category: 'knobeln',
    preview: (
      <span className="mini">
        <span className="mini-card">🐶</span>
        <span className="mini-card back" />
        <span className="mini-card">🐶</span>
      </span>
    ),
    component: Memory,
  },
];

export const findExercise = (id: string | null) => EXERCISES.find((e) => e.id === id) ?? null;
