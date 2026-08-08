interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex flex-wrap bg-[var(--color-surface-container)] p-xs rounded-lg border border-[rgba(var(--overlay-rgb),0.08)] gap-0.5">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-md text-label-md transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-[0_0_12px_rgba(0,218,243,0.3)]'
                : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
