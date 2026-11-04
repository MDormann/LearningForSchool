import { useEffect, useState } from 'react';
import { ExerciseContext } from './components/exercise';
import { areaOf, findExercise, isArea, type Area } from './exercises';
import { Home } from './Home';
import { useRoute } from './lib/route';
import { useStored } from './lib/storage';

export function App() {
  const route = useRoute();
  const exercise = findExercise(route);
  // The last chosen area (Vorschule / 2. Klasse) opens again on the next visit.
  const [lastArea, setLastArea] = useStored<Area>('area', 'vorschule');
  const area: Area = exercise ? areaOf(exercise) : isArea(route) ? route : lastArea;
  // Bumping the key remounts the exercise, which is how "Nochmal" starts a fresh round.
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (area !== lastArea) setLastArea(area);
  }, [area, lastArea, setLastArea]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = exercise ? `${exercise.title} · Lernkiste` : 'Lernkiste';
  }, [exercise, runKey, area]);

  if (!exercise) return <Home area={area} />;
  const Component = exercise.component;
  return (
    <ExerciseContext.Provider value={{ id: exercise.id, title: exercise.title, area, restart: () => setRunKey((k) => k + 1) }}>
      <Component key={`${exercise.id}-${runKey}`} />
    </ExerciseContext.Provider>
  );
}
