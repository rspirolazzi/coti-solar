export const steps = [
  {
    slug: 'ubicacion',
    href: '/calculadora/ubicacion',
    label: 'Ubicación',
    title: 'Ubicación y radiación',
    description: 'Elegí el sitio y la inclinación para obtener la radiación solar.',
  },
  {
    slug: 'consumo',
    href: '/calculadora/consumo',
    label: 'Consumo',
    title: 'Consumo y energía',
    description: 'Cargá los artefactos, sus horas de uso y la energía diaria a generar.',
  },
  {
    slug: 'paneles',
    href: '/calculadora/paneles',
    label: 'Paneles',
    title: 'Paneles solares',
    description: 'Definí el modelo, la cantidad y la energía que produce el arreglo.',
  },
  {
    slug: 'baterias',
    href: '/calculadora/baterias',
    label: 'Baterías',
    title: 'Banco de baterías',
    description: 'Dimensioná autonomía, capacidad, disposición y corrientes.',
  },
  {
    slug: 'equipos',
    href: '/calculadora/equipos',
    label: 'Equipos',
    title: 'Regulador e inversor',
    description: 'Revisá las corrientes y potencias requeridas y los equipos elegidos.',
  },
  {
    slug: 'resumen',
    href: '/calculadora/resumen',
    label: 'Resumen',
    title: 'Resumen y presupuesto',
    description: 'Revisá el sistema completo y descargá el reporte.',
  },
] as const;

export type Step = (typeof steps)[number];

export function stepIndexFromPath(pathname: string): number {
  const index = steps.findIndex((step) => pathname === step.href || pathname.startsWith(`${step.href}/`));
  return index >= 0 ? index : 0;
}

export function previousStep(pathname: string): Step | null {
  const index = stepIndexFromPath(pathname);
  return index > 0 ? steps[index - 1] : null;
}

export function nextStep(pathname: string): Step | null {
  const index = stepIndexFromPath(pathname);
  return index < steps.length - 1 ? steps[index + 1] : null;
}
