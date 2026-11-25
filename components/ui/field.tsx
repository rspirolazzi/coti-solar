import * as React from 'react';
import { cn } from '@/lib/cn';

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-danger">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-panel">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field', className)} {...props} />;
}

export function NumberInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | undefined | null;
  onValueChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={cn('field num', className)}
      value={Number.isFinite(value as number) ? (value as number) : ''}
      onChange={(event) => {
        const next = event.target.value;
        onValueChange(next === '' ? 0 : Number(next));
      }}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('field', className)} {...props}>
      {children}
    </select>
  );
}
