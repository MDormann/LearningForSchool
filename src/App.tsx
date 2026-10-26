import { useEffect, useState } from 'react';
import { ExerciseContext } from './components/exercise';
import { findExercise } from './exercises';
import { Home } from './Home';
import { useRoute } from './lib/route';

export function App() {
  const route = useRoute();
  const exercise = findExercise(route);
  // Bumping the key remounts the exercise, which is how "Nochmal" starts a fresh round.
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = exercise ? `${exercise.title} · Lernkiste` : 'Lernkiste';
  }, [exercise, runKey]);

  if (!exercise) return <Home />;
  const Component = exercise.component;
  return (
    <ExerciseContext.Provider value={{ id: exercise.id, title: exercise.title, restart: () => setRunKey((k) => k + 1) }}>
      <Component key={`${exercise.id}-${runKey}`} />
    </ExerciseContext.Provider>
  );
}
