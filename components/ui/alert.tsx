import { AlertTriangle, CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

const styles = {
  info: 'border-line bg-white text-ink',
  warning: 'border-solar/40 bg-solar/10 text-ink',
  error: 'border-danger/30 bg-danger/5 text-danger',
  success: 'border-close/30 bg-close/5 text-ink',
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: keyof typeof styles;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon =
    variant === 'error' ? CircleAlert : variant === 'success' ? CircleCheck : AlertTriangle;
  return (
    <div className={cn('flex gap-3 rounded-xl border p-4 text-sm', styles[variant], className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-1 leading-6">{children}</div> : null}
      </div>
    </div>
  );
}
