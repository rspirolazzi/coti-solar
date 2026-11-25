import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export function StepPage({
  title,
  description,
  children,
  backHref,
  nextHref,
  nextLabel = 'Continuar',
  blockedReason,
  onNext,
}: {
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
  blockedReason?: string;
  onNext?: () => void;
}) {
  const disabled = !!blockedReason;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-panel">{description}</p>
      </div>

      <Card>
        <CardContent className="pt-5">{children}</CardContent>
      </Card>

      {blockedReason ? (
        <Alert variant="warning" title="Falta completar">
          {blockedReason}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
        {backHref ? (
          <Button asChild variant="ghost">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              Atrás
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {nextHref ? (
          disabled ? (
            <Button disabled title={blockedReason}>
              {nextLabel}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button asChild>
              <Link href={nextHref} onClick={onNext}>
                {nextLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
