import type { ComponentType, ReactNode } from 'react';
import { Anlaute } from './Anlaute';
import { Ballblitz } from './Ballblitz';
import { Lagewoerter } from './Lagewoerter';
import { Memory } from './Memory';
import { Mengen } from './Mengen';
import { Muster } from './Muster';
import { Nachbarzahlen } from './Nachbarzahlen';
import { Silben } from './Silben';
import { Wuerfelblick } from './Wuerfelblick';
import { Zaehlen } from './Zaehlen';
import { Zehnerfeld } from './Zehnerfeld';
import { Bis100, Einmaleins, Ergaenzen, Rechenolympiade } from './klasse2/Rechnen';

export type Area = 'vorschule' | 'klasse2';
export type Category = 'zahlen' | 'sprache' | 'knobeln' | 'plusminus' | 'mal';

export type Exercise = {
  id: string;
  title: string;
  description: string;
  category: Category;
  /** Small picture shown on the home card. */
  preview: ReactNode;
  component: ComponentType;
};

export const AREAS: { id: Area; title: string; emoji: string; lead: string }[] = [
  { id: 'vorschule', title: 'Vorschule', emoji: '🧸', lead: 'Such dir eine Übung aus! Die Aufgaben werden vorgelesen – du tippst die Antwort.' },
  { id: 'klasse2', title: '2. Klasse', emoji: '✏️', lead: 'Rechnen wie in der Schule: Tippe das Ergebnis ins Zahlenfeld. Bei Fehlern gibt es eine Rechenhilfe.' },
];

export const CATEGORIES: { id: Category; area: Area; title: string; blurb: string }[] = [
  { id: 'zahlen', area: 'vorschule', title: 'Zahlen', blurb: 'Zählen, Mengen sehen, Zahlen ordnen' },
  { id: 'sprache', area: 'vorschule', title: 'Buchstaben & Wörter', blurb: 'Anlaute hören, Silben klatschen, Lagewörter' },
  { id: 'knobeln', area: 'vorschule', title: 'Knobeln', blurb: 'Muster erkennen, Paare merken' },
  { id: 'plusminus', area: 'klasse2', title: 'Plus & Minus', blurb: 'Rechenolympiade, Ergänzen, Rechnen bis 100' },
  { id: 'mal', area: 'klasse2', title: 'Mal & Geteilt', blurb: 'Das kleine Einmaleins' },
];

export const areaOf = (e: Exercise): Area => CATEGORIES.find((c) => c.id === e.category)!.area;
export const isArea = (route: string | null): route is Area => AREAS.some((a) => a.id === route);

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
    id: 'mengen',
    title: 'Mengen zählen',
    description: 'Wie viele Bälle sind es? Zählen und die richtige Zahl antippen.',
    category: 'zahlen',
    preview: (
      <span className="mini">
        <span className="mini-emoji">⚽⚽⚽</span>
        <b className="r">3</b>
      </span>
    ),
    component: Mengen,
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
    id: 'lagewoerter',
    title: 'Wo ist was?',
    description: 'Auf, unter, neben, hinter, vor oder in? Lagewörter verstehen.',
    category: 'sprache',
    preview: (
      <span className="mini">
        <span className="mini-emoji">⚽</span>
        <b>unter</b>
      </span>
    ),
    component: Lagewoerter,
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
  {
    id: 'olympiade',
    title: 'Rechenolympiade',
    description: 'Plus und Minus bis 20 mit Zehnerübergang – auf Zeit, mit Bestzeit.',
    category: 'plusminus',
    preview: (
      <span className="mini">
        <b className="op">6+7</b>
        <span className="mini-emoji">⏱️</span>
      </span>
    ),
    component: Rechenolympiade,
  },
  {
    id: 'ergaenzen',
    title: 'Ergänzen',
    description: 'Welche Zahl fehlt? 8 + ? = 13',
    category: 'plusminus',
    preview: (
      <span className="mini">
        <b className="op">8+?</b>
        <b>13</b>
      </span>
    ),
    component: Ergaenzen,
  },
  {
    id: 'bis100',
    title: 'Rechnen bis 100',
    description: 'Zehner, Einer, Übergang und zweistellige Zahlen – Schritt für Schritt.',
    category: 'plusminus',
    preview: (
      <span className="mini">
        <b className="op">47+8</b>
      </span>
    ),
    component: Bis100,
  },
  {
    id: 'einmaleins',
    title: 'Einmaleins',
    description: 'Mal- und Geteiltaufgaben, Reihen frei wählbar.',
    category: 'mal',
    preview: (
      <span className="mini">
        <b className="op">7·8</b>
      </span>
    ),
    component: Einmaleins,
  },
];

export const findExercise = (id: string | null) => EXERCISES.find((e) => e.id === id) ?? null;
