import React from 'react';
import { cn } from '../lib/utils';

export function LabCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl shadow-[0_1px_4px_rgba(2,10,20,0.08)] transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function LabButton({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary:
      'bg-[var(--accent)] text-[var(--accent-fg)] font-semibold hover:bg-[var(--accent-hover)] active:scale-[0.99] border border-transparent shadow-xs',
    secondary:
      'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] active:scale-[0.99]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] border border-transparent',
    danger:
      'bg-[var(--bg-surface-elevated)] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 active:scale-[0.99]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
  };

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (val: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-[var(--bg-subtle)] border border-[var(--border-hairline)] rounded-lg',
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer',
              active
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  displayValue,
  helperText,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (val: number) => void;
  displayValue?: string;
  helperText?: string;
}) {
  const safeVal = Number.isFinite(value) ? value : min;
  const clamped = Math.min(Math.max(safeVal, min), max);
  const pct = ((clamped - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      {(label || displayValue !== undefined) && (
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
          <div className="font-mono tabular-nums text-sm font-semibold text-[var(--text-primary)]">
            {displayValue ?? safeVal}
            {unit ? <span className="text-xs font-normal text-[var(--text-muted)] ml-1">{unit}</span> : null}
          </div>
        </div>
      )}
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="lab-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--slider-track) ${pct}%, var(--slider-track) 100%)`,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
        <span>
          {min} {unit}
        </span>
        {helperText ? <span className="font-sans text-[var(--text-muted)]">{helperText}</span> : null}
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-hairline)]">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        {subtitle ? <p className="text-sm text-[var(--text-secondary)] max-w-2xl">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2 shrink-0 flex-wrap">{action}</div> : null}
    </div>
  );
}
