import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useStored } from './storage';
import { setSoundEnabled } from './sound';
import { setSpeechEnabled } from './speech';

type Prefs = { sound: boolean; speech: boolean };

type AppState = {
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  /** Stars collected per exercise id. */
  stars: Record<string, number>;
  addStars: (exerciseId: string, n: number) => void;
  totalStars: number;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useStored<Prefs>('prefs', { sound: true, speech: true });
  const [stars, setStars] = useStored<Record<string, number>>('stars', {});

  useEffect(() => setSoundEnabled(prefs.sound), [prefs.sound]);
  useEffect(() => setSpeechEnabled(prefs.speech), [prefs.speech]);

  const addStars = useCallback(
    (id: string, n: number) => {
      if (n > 0) setStars((s) => ({ ...s, [id]: (s[id] ?? 0) + n }));
    },
    [setStars],
  );
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  return <Ctx.Provider value={{ prefs, setPrefs, stars, addStars, totalStars }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
