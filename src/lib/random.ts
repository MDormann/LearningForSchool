export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** A deck of `count` items drawn from `pool` in shuffled bags, never repeating the same item twice in a row. */
export function makeDeck<T>(pool: readonly T[], count: number): T[] {
  const deck: T[] = [];
  let bag: T[] = [];
  while (deck.length < count) {
    if (!bag.length) bag = shuffle([...pool]);
    let i = bag.findIndex((x) => x !== deck[deck.length - 1]);
    if (i < 0) i = 0;
    deck.push(bag.splice(i, 1)[0]);
  }
  return deck;
}

/** Rechenkette colors: 1–5 red, 6–10 blue (repeats every ten). */
export const chainColor = (n: number) => ((n - 1) % 10 < 5 ? 'r' : 'b');
