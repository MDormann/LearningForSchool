import { useCallback } from 'react';
import { Segmented } from '../../components/Segmented';
import { makeDeck, range } from '../../lib/random';
import { useStored } from '../../lib/storage';
import { Drill } from './Drill';
import { LEVEL100_LABELS, pool100, pool20, poolTimes, withGaps, type Level100, type Level20, type MulChoice, type OpChoice } from './tasks';

const OPS: [string, OpChoice][] = [
  ['Plus', 'plus'],
  ['Minus', 'minus'],
  ['Gemischt', 'mix'],
];

/** Rechenolympiade: plus and minus up to 20 against the clock, like the worksheet from school. */
export function Rechenolympiade() {
  const [p, setP] = useStored('olympiade', { ops: 'mix' as OpChoice, level: 'uebergang' as Level20, count: 20 });
  const makeTasks = useCallback(() => makeDeck(pool20(p.ops, p.level), p.count), [p.ops, p.level, p.count]);
  return (
    <Drill
      timed
      intro="Rechne so schnell und so genau du kannst! Die Uhr läuft, sobald du auf „Los“ tippst."
      settingsKey={`olympiade-${p.ops}-${p.level}-${p.count}`}
      makeTasks={makeTasks}
      settings={
        <>
          <Segmented label="Rechenart" options={OPS} value={p.ops} onChange={(ops) => setP({ ...p, ops })} />
          <Segmented label="Aufgaben" options={[['mit Zehnerübergang', 'uebergang'], ['alle bis 20', 'alle']]} value={p.level} onChange={(level) => setP({ ...p, level })} />
          <Segmented label="Anzahl" options={[['10', 10], ['20', 20], ['48 (ganzes Blatt)', 48]]} value={p.count} onChange={(count) => setP({ ...p, count })} />
        </>
      }
    />
  );
}

/** Missing numbers: 8 + _ = 13, _ − 5 = 7. */
export function Ergaenzen() {
  const [p, setP] = useStored('ergaenzen', { ops: 'mix' as OpChoice, space: 20 as 20 | 100 });
  const makeTasks = useCallback(
    () => makeDeck(withGaps(p.space === 20 ? pool20(p.ops, 'alle') : pool100(p.ops, 'einer')), 10),
    [p.ops, p.space],
  );
  return (
    <Drill
      intro="Welche Zahl fehlt?"
      settingsKey={`ergaenzen-${p.ops}-${p.space}`}
      makeTasks={makeTasks}
      settings={
        <>
          <Segmented label="Rechenart" options={OPS} value={p.ops} onChange={(ops) => setP({ ...p, ops })} />
          <Segmented label="Zahlenraum" options={[['bis 20', 20], ['bis 100', 100]]} value={p.space} onChange={(space) => setP({ ...p, space })} />
        </>
      }
    />
  );
}

/** Plus and minus in the number range up to 100, step by step. */
export function Bis100() {
  const [p, setP] = useStored('bis100', { ops: 'mix' as OpChoice, level: 'einer' as Level100 });
  const makeTasks = useCallback(() => makeDeck(pool100(p.ops, p.level), 10), [p.ops, p.level]);
  return (
    <Drill
      intro="Rechne im Hunderterraum."
      settingsKey={`bis100-${p.ops}-${p.level}`}
      makeTasks={makeTasks}
      settings={
        <>
          <Segmented label="Rechenart" options={OPS} value={p.ops} onChange={(ops) => setP({ ...p, ops })} />
          <Segmented label="Stufe" options={LEVEL100_LABELS} value={p.level} onChange={(level) => setP({ ...p, level })} />
        </>
      }
    />
  );
}

/** The small times table; rows can be picked freely (default: core rows 2, 5, 10). */
export function Einmaleins() {
  const [p, setP] = useStored('einmaleins', { rows: [2, 5, 10] as number[], kind: 'mal' as MulChoice });
  const rows = p.rows.length ? [...p.rows].sort((a, b) => a - b) : [2];
  const rowsKey = rows.join('_');
  const makeTasks = useCallback(() => makeDeck(poolTimes(rowsKey.split('_').map(Number), p.kind), 10), [rowsKey, p.kind]);
  const toggle = (r: number) => {
    const next = p.rows.includes(r) ? p.rows.filter((x) => x !== r) : [...p.rows, r];
    if (next.length) setP({ ...p, rows: next });
  };
  return (
    <Drill
      intro="Das kleine Einmaleins."
      settingsKey={`einmaleins-${rowsKey}-${p.kind}`}
      makeTasks={makeTasks}
      settings={
        <>
          <Segmented label="Rechenart" options={[['Mal', 'mal'], ['Geteilt', 'geteilt'], ['Gemischt', 'mix']]} value={p.kind} onChange={(kind) => setP({ ...p, kind })} />
          <div className="rows-pick" role="group" aria-label="Einmaleins-Reihen">
            <span>Reihen:</span>
            {range(1, 10).map((r) => (
              <button key={r} type="button" aria-pressed={rows.includes(r)} onClick={() => toggle(r)}>
                {r}
              </button>
            ))}
          </div>
        </>
      }
    />
  );
}
