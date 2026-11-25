'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand px-6 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Algo salió mal.</h1>
      <p className="max-w-md text-sm text-panel">
        Podés reintentar. Si el problema sigue, recargá la página; el borrador queda guardado en
        este navegador.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
