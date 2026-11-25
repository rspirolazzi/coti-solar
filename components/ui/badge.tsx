import { cn } from '@/lib/cn';

const variants = {
  default: 'bg-sand text-ink border-line',
  solar: 'bg-solar/15 text-ink border-solar/40',
  success: 'bg-close/10 text-close border-close/30',
  warning: 'bg-solar/15 text-ink border-solar/40',
  danger: 'bg-danger/10 text-danger border-danger/30',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
