type Props<T> = {
  label: string;
  options: readonly (readonly [string, T])[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string | number | boolean>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([text, v]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
