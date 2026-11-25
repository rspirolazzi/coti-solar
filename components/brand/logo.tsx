import Image from 'next/image';
import { cn } from '@/lib/cn';

export function Logo({
  variant = 'dark',
  className,
  width = 220,
  priority = false,
}: {
  variant?: 'dark' | 'light';
  className?: string;
  width?: number;
  priority?: boolean;
}) {
  const src =
    variant === 'light'
      ? '/brand/cotisolar-isologo-reverso.svg'
      : '/brand/cotisolar-isologo.svg';
  return (
    <Image
      src={src}
      alt="CotiSolar"
      width={width}
      height={Math.round((width * 120) / 520)}
      className={cn('h-auto', className)}
      style={{ width, height: 'auto' }}
      priority={priority}
      unoptimized
    />
  );
}
