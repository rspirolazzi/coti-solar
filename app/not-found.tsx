import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-sand px-6 text-center">
      <Logo width={200} />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-solar">Error 404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Esa página no existe.</h1>
        <p className="mt-2 text-panel">Volvé al inicio o empezá un cálculo nuevo.</p>
      </div>
      <Button asChild>
        <Link href="/">Ir al inicio</Link>
      </Button>
    </div>
  );
}
