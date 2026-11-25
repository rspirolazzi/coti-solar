'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BatteryCharging, FileSpreadsheet, Gauge, MapPinned, Sparkles } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { useProject, useProjectStore, useStoreHydrated } from '@/lib/store';
import { calculateProject } from '@/domain/calculations';

export function LandingPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const project = useProject();
  const newProject = useProjectStore((state) => state.newProject);
  const loadExample = useProjectStore((state) => state.loadExample);
  const calculation = calculateProject(project);
  const hasDraft =
    project.consumption.items.length > 0 ||
    project.panels.items.length > 0 ||
    !!project.location;

  if (!hydrated) {
    return <div className="min-h-screen bg-sand" />;
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo width={190} priority />
        <Link href="/calculadora/ubicacion" className="text-sm font-semibold text-ink hover:underline">
          Ir a la calculadora
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
          <div>
            <Badge variant="solar" className="mb-5">Dimensionamiento fotovoltaico</Badge>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              La cuenta
              <br />
              que cierra.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-panel">
              Del relevamiento al presupuesto, en minutos. CotiSolar convierte consumos y radiación
              en un sistema bien dimensionado y un presupuesto que se puede defender.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => {
                  newProject();
                  router.push('/calculadora/ubicacion');
                }}
              >
                Nuevo cálculo
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  loadExample();
                  router.push('/calculadora/ubicacion');
                }}
              >
                <Sparkles className="size-4" />
                Ver ejemplo Buenos Aires
              </Button>
            </div>
            <p className="mt-4 text-xs text-panel">
              Tus datos quedan en este navegador. No se guardan en un servidor.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-solar/20 blur-2xl" />
            <Card className="overflow-hidden">
              <div className="bg-ink p-6 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-solar">
                    {hasDraft ? 'Borrador actual' : 'Ejemplo de salida'}
                  </p>
                  <Gauge className="size-5 text-solar" />
                </div>
                <p className="mt-2 truncate font-display text-2xl font-semibold">{project.name}</p>
                <p className="mt-1 text-sm text-white/60">
                  {project.location?.label ?? 'Sin ubicación todavía'}
                </p>
              </div>
              <CardContent className="grid grid-cols-2 gap-4 pt-5">
                <Metric label="Consumo máximo" value={`${calculation.consumption.maxWhDay} Wh/día`} />
                <Metric label="Potencia FV" value={`${calculation.panels.nominalW} W`} />
                <Metric label="Banco" value={`${calculation.battery.capacityAh} Ah`} />
                <Metric label="Inversión" value={`USD ${calculation.costs.total}`} />
              </CardContent>
              <div className="border-t border-line p-5">
                {hasDraft ? (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => router.push('/calculadora/ubicacion')}
                  >
                    Continuar borrador
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <p className="text-sm leading-6 text-panel">
                    Empezá por la ubicación. CotiSolar obtiene la radiación y te guía hasta el
                    presupuesto.
                  </p>
                )}
                {project.updatedAt ? (
                  <p className="mt-3 text-xs text-panel">Actualizado {formatDate(project.updatedAt)}</p>
                ) : null}
              </div>
            </Card>
          </div>
        </section>

        <section className="border-y border-line bg-white/50">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3">
            <Feature
              icon={MapPinned}
              title="Ubicación con mapa"
              text="Buscá, hacé clic en el mapa o pegá coordenadas. Radiación PVGIS con inclinación óptima."
            />
            <Feature
              icon={BatteryCharging}
              title="Cálculo explicado"
              text="Consumos, paneles, baterías, regulador e inversor con supuestos y advertencias visibles."
            />
            <Feature
              icon={FileSpreadsheet}
              title="PDF y Excel"
              text="Descargá un reporte profesional y una planilla editable para compartir o archivar."
            />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-sm text-panel sm:px-6">
        CotiSolar · cotisolar.com
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-panel">{label}</p>
      <p className="num mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPinned;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-solar/20 text-ink">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-panel">{text}</p>
      </div>
    </div>
  );
}
