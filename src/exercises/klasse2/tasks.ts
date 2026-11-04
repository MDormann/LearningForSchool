import { range } from '../../lib/random';

export type Op = '+' | '-' | '·' | ':';
/** A calculation `a op b = result`; `gap` says which of the three the child has to fill in. */
export type CalcTask = { a: number; op: Op; b: number; result: number; gap: 'a' | 'b' | 'result' };

export type OpChoice = 'plus' | 'minus' | 'mix';

const calc = (a: number, op: Op, b: number): CalcTask => {
  const result = op === '+' ? a + b : op === '-' ? a - b : op === '·' ? a * b : a / b;
  return { a, op, b, result, gap: 'result' };
};

export const answerOf = (t: CalcTask) => t[t.gap];
export const taskKey = (t: CalcTask) => `${t.a}${t.op}${t.b}${t.gap}`;

const OP_WORDS: Record<Op, string> = { '+': 'plus', '-': 'minus', '·': 'mal', ':': 'geteilt durch' };

/** How the task is read aloud, with "wie viel" for the gap. */
export function spoken(t: CalcTask) {
  const part = (k: 'a' | 'b' | 'result') => (t.gap === k ? 'wie viel' : String(t[k]));
  return `${part('a')} ${OP_WORDS[t.op]} ${part('b')} gleich ${part('result')}`;
}

function byOp<T>(choice: OpChoice, plus: T[], minus: T[]): T[] {
  return choice === 'plus' ? plus : choice === 'minus' ? minus : [...plus, ...minus];
}

// ---------- Plus und Minus bis 20 (Rechenolympiade) ----------

export type Level20 = 'uebergang' | 'alle';

/**
 * Pool like the "Rechenolympiade" sheet: single-digit plus single-digit with crossing ten (6 + 7, 9 + 2)
 * and the matching minus tasks (13 − 5, 17 − 8). "alle" adds every other task in the number range up to 20.
 */
export function pool20(ops: OpChoice, level: Level20): CalcTask[] {
  const plus: CalcTask[] = [];
  const minus: CalcTask[] = [];
  for (const a of range(1, 19)) {
    for (const b of range(1, 19)) {
      const sum = a + b;
      if (sum > 20) continue;
      const crossing = a < 10 && b < 10 && sum > 10;
      if (level === 'uebergang' ? !crossing : a < 2 || b < 2) continue;
      plus.push(calc(a, '+', b));
      minus.push(calc(sum, '-', b));
    }
  }
  return byOp(ops, plus, minus);
}

// ---------- Plus und Minus bis 100 ----------

export type Level100 = 'zehner' | 'einer' | 'uebergang' | 'zweistellig';

export const LEVEL100_LABELS: [string, Level100][] = [
  ['Zehner', 'zehner'],
  ['+ Einer', 'einer'],
  ['Übergang', 'uebergang'],
  ['ZE + ZE', 'zweistellig'],
];

/**
 * zehner: 30 + 40, 90 − 60 · einer: 34 + 5, 47 − 3 (no crossing) ·
 * uebergang: 47 + 8, 52 − 7 · zweistellig: 34 + 25, 76 − 43, 38 + 27 …
 */
export function pool100(ops: OpChoice, level: Level100): CalcTask[] {
  const plus: CalcTask[] = [];
  const minus: CalcTask[] = [];
  const add = (a: number, b: number) => {
    plus.push(calc(a, '+', b));
    minus.push(calc(a + b, '-', b));
  };
  if (level === 'zehner') {
    for (const a of range(1, 9)) for (const b of range(1, 9)) if (a + b <= 10) add(a * 10, b * 10);
  } else if (level === 'einer' || level === 'uebergang') {
    for (const a of range(11, 98)) {
      if (a % 10 === 0) continue;
      for (const b of range(2, 9)) {
        const crossing = (a % 10) + b > 10;
        if (a + b > 100 || (level === 'einer' ? crossing || (a % 10) + b === 10 : !crossing)) continue;
        add(a, b);
      }
    }
  } else {
    for (const a of range(11, 89)) {
      if (a % 10 === 0) continue;
      for (const b of range(11, 89)) if (b % 10 !== 0 && a + b <= 100) add(a, b);
    }
  }
  return byOp(ops, plus, minus);
}

// ---------- Ergänzen / Platzhalter ----------

/** Same tasks, but with the gap in the first or second number: 8 + _ = 13, _ − 5 = 7. */
export function withGaps(pool: CalcTask[]): CalcTask[] {
  return pool.flatMap((t) => [
    { ...t, gap: 'b' as const },
    { ...t, gap: 'a' as const },
  ]);
}

// ---------- Einmaleins ----------

export type MulChoice = 'mal' | 'geteilt' | 'mix';

export function poolTimes(rows: number[], kind: MulChoice): CalcTask[] {
  const mul: CalcTask[] = [];
  const div: CalcTask[] = [];
  for (const r of rows) {
    for (const k of range(1, 10)) {
      mul.push(Math.random() < 0.5 ? calc(k, '·', r) : calc(r, '·', k));
      div.push(calc(k * r, ':', r));
    }
  }
  return kind === 'mal' ? mul : kind === 'geteilt' ? div : [...mul, ...div];
}

// ---------- Rechenhilfe ----------

/**
 * Step-by-step help for crossing ten ("erst bis zur 10") or, for the times table, the neighbouring
 * core task. Returns null when there is no useful split.
 */
export function hint(t: CalcTask): string[] | null {
  const { a, b, result } = t;
  // Gap tasks: the inverse task ("Umkehraufgabe") finds the missing number.
  if (t.gap !== 'result') {
    const inverse =
      t.op === '+' ? (t.gap === 'b' ? `${result} − ${a}` : `${result} − ${b}`) : t.op === '-' ? (t.gap === 'b' ? `${a} − ${result}` : `${result} + ${b}`) : null;
    return inverse ? ['Tipp: Rechne die Umkehraufgabe', `${inverse} = ?`] : null;
  }
  if (t.op === '+') {
    const toTen = 10 - (a % 10);
    if (b > toTen && b < 10 && a % 10 !== 0) {
      const next = a + toTen;
      return [`Zerlege die ${b}: ${b} = ${toTen} + ${b - toTen}`, `Erst bis ${next}: ${a} + ${toTen} = ${next}`, `Dann den Rest: ${next} + ${b - toTen} = ?`];
    }
    if (b >= 10 && a >= 10 && b % 10 !== 0) {
      const tens = b - (b % 10);
      return [`Erst die Zehner: ${a} + ${tens} = ${a + tens}`, `Dann die Einer: ${a + tens} + ${b % 10} = ?`];
    }
    return null;
  }
  if (t.op === '-') {
    const down = a % 10;
    if (b > down && b < 10 && down !== 0) {
      const ten = a - down;
      return [`Zerlege die ${b}: ${b} = ${down} + ${b - down}`, `Erst bis ${ten}: ${a} − ${down} = ${ten}`, `Dann den Rest: ${ten} − ${b - down} = ?`];
    }
    if (b >= 10 && a >= 10 && b % 10 !== 0) {
      const tens = b - (b % 10);
      return [`Erst die Zehner: ${a} − ${tens} = ${a - tens}`, `Dann die Einer: ${a - tens} − ${b % 10} = ?`];
    }
    return null;
  }
  if (t.op === '·') {
    // Derive from a core task (2·, 5·, 10·): 7 · 8 = 5 · 8 + 2 · 8, 9 · 8 = 10 · 8 − 1 · 8.
    const [k, r] = a <= b ? [a, b] : [b, a];
    if ([1, 2, 5, 10].includes(k) || r === 10) return null;
    const core = k < 5 ? 2 : k < 8 ? 5 : 10;
    const diff = Math.abs(k - core);
    return [`Kernaufgabe: ${core} · ${r} = ${core * r}`, `${k} · ${r} ist ${diff} · ${r} ${k > core ? 'mehr' : 'weniger'}`];
  }
  return [`Wie oft passt die ${b} in die ${a}?`, `? · ${b} = ${a}`];
}
