import { cn } from '@/lib/cn';

export function Progress({ value, className }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-ink/10', className)}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-solar transition-[width]" style={{ width: `${safe}%` }} />
    </div>
  );
}
