import { useCallback, useEffect, useRef, useState } from 'react';

/** setTimeout that is cancelled automatically when the component unmounts. */
export function useLater() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach(clearTimeout), []);
  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    ids.current.push(id);
    return id;
  }, []);
}

/** Bookkeeping for exercises made of a fixed number of rounds. */
export function useRounds(total: number) {
  const [results, setResults] = useState<boolean[]>([]);
  const push = useCallback((ok: boolean) => setResults((r) => [...r, ok]), []);
  const score = results.filter(Boolean).length;
  return { results, round: results.length, score, total, push, last: results.length >= total };
}

/** Re-triggers a CSS animation class (e.g. a shake) each time `fire` is called. */
export function useFlash(): [number, () => void] {
  const [n, setN] = useState(0);
  return [n, useCallback(() => setN((x) => x + 1), [])];
}
