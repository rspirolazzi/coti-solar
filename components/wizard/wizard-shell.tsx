'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/logo';
import { ProjectMenu } from '@/components/wizard/project-menu';
import { LiveSummary } from '@/components/wizard/live-summary';
import { steps, stepIndexFromPath } from '@/lib/steps';
import { stepCompletion } from '@/lib/step-completion';
import { useProject, useStoreHydrated } from '@/lib/store';
import { cn } from '@/lib/cn';
import { Progress } from '@/components/ui/progress';

export function WizardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useStoreHydrated();
  const project = useProject();
  const index = stepIndexFromPath(pathname);
  const completion = stepCompletion(project);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-panel">
        <Loader2 className="size-5 animate-spin" />
        Cargando cálculo…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="CotiSolar, inicio">
            <Logo variant="light" width={170} priority />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-white/60 sm:block">Borrador local</span>
            <ProjectMenu />
          </div>
        </div>

        <div className="border-t border-white/10">
          <nav
            aria-label="Pasos del cálculo"
            className="mx-auto hidden max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:flex"
          >
            {steps.map((step, stepIndex) => {
              const complete = completion[step.slug as keyof typeof completion];
              const current = stepIndex === index;
              return (
                <Link
                  key={step.href}
                  href={step.href}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    current ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 place-items-center rounded-full text-xs font-bold',
                      complete
                        ? 'bg-close text-white'
                        : current
                          ? 'bg-solar text-ink'
                          : 'border border-white/20 text-white/70',
                    )}
                  >
                    {complete ? <Check className="size-3.5" /> : stepIndex + 1}
                  </span>
                  {step.label}
                </Link>
              );
            })}
          </nav>

          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:hidden">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Paso {index + 1} de {steps.length}</span>
                <span>{steps[index].label}</span>
              </div>
              <Progress value={((index + 1) / steps.length) * 100} className="mt-2 bg-white/15" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">{children}</div>
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <LiveSummary />
          </div>
        </aside>
        <div className="lg:hidden">
          <details className="rounded-2xl border border-line bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Ver resumen en vivo
            </summary>
            <div className="mt-4">
              <LiveSummary />
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}
