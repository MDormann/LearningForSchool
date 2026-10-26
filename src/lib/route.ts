import { useEffect, useState } from 'react';

/** Hash routing keeps GitHub Pages happy: '#/' is home, '#/<exerciseId>' opens an exercise. */
function current() {
  return decodeURIComponent(window.location.hash.replace(/^#\/?/, '')) || null;
}

export function useRoute() {
  const [route, setRoute] = useState<string | null>(current);
  useEffect(() => {
    const on = () => setRoute(current());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const goTo = (id: string | null) => {
  window.location.hash = id ? `/${id}` : '/';
};
