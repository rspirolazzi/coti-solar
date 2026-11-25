import type { ProjectDraft } from './types';

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const now = () => new Date().toISOString();

const defaultBattery = {
  model: 'Moura CLEAN 12MF220',
  capacityAh: 220,
  voltage: 12,
  price: 550.85,
};

const defaultInverter = {
  model: '',
  continuousW: 0,
  surgeW: 0,
  inputV: 24,
  maxCurrentA: 0,
  price: 0,
};

export function createProject(name = 'Nuevo cálculo'): ProjectDraft {
  const timestamp = now();
  return {
    schemaVersion: 1,
    id: createId(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    location: null,
    consumption: {
      items: [],
      powerFactor: 0.7,
      securityFactor: 110,
      systemEfficiency: 60,
      cloudyDays: 3,
      cloudyFrequency: 15,
    },
    panels: {
      items: [],
      temperatureC: 25,
      qtyMode: 'auto',
    },
    battery: {
      model: defaultBattery,
      autonomyDays: 3,
      reserveDays: 1,
      depthOfDischarge: 80,
      dischargeEfficiency: 90,
      inverterEfficiency: 84,
      voltage: 24,
    },
    equipment: {
      controllers: [],
      inverter: defaultInverter,
    },
    costs: {
      currency: 'USD',
      extras: [],
      marginPct: 0,
    },
  };
}

const exampleItems = [
  { name: 'Luz', qty: 5, watts: 10, winterHours: 7, summerHours: 5 },
  { name: 'TV', qty: 1, watts: 75, winterHours: 4, summerHours: 3 },
  { name: 'Decodificador', qty: 1, watts: 30, winterHours: 4, summerHours: 3 },
  { name: 'Refrigerador', qty: 1, watts: 80, winterHours: 8, summerHours: 8 },
  { name: 'PC', qty: 1, watts: 40, winterHours: 4, summerHours: 3 },
];

// Valores PVGIS 5.3 para Buenos Aires a 49° (norte). Fuente: PVGIS-SARAH3, 2005–2023.
const exampleHsp = [5.7, 5.9, 5.88, 5.28, 4.28, 3.74, 3.68, 4.42, 4.9, 5.46, 5.69, 5.71];

export function createExampleProject(): ProjectDraft {
  const base = createProject('Ejemplo Buenos Aires');
  return {
    ...base,
    id: 'example-buenos-aires',
    location: {
      label: 'Ciudad Autónoma de Buenos Aires, Argentina',
      lat: -34.576653,
      lng: -58.453485,
      elevation: 22,
      country: 'Argentina',
      admin1: 'Ciudad Autónoma de Buenos Aires',
      source: 'example',
      radiation: {
        provider: 'pvgis',
        database: 'PVGIS-SARAH3',
        period: '2005–2023',
        tiltDeg: 49,
        azimuthDeg: -180,
        monthlyHsp: exampleHsp,
        optimalTiltDeg: 32,
        annualAverage: 5.05,
        fetchedAt: now(),
      },
    },
    consumption: {
      ...base.consumption,
      items: exampleItems.map((item) => ({ ...item, id: createId() })),
    },
    panels: {
      ...base.panels,
      qtyMode: 'manual',
      qtyOverride: 16,
      items: [
        {
          id: createId(),
          model: 'Solartec KS80T - SL*',
          powerW: 80,
          vmp: 12,
          voc: 21.6,
          isc: 5.01,
          imp: 4.6,
          tempCoeffVocPct: -0.3,
          tempC: 25,
          price: 357.4675,
          qty: 16,
        },
      ],
    },
    battery: {
      ...base.battery,
      autonomyDays: 3,
      reserveDays: 1,
      voltage: 24,
    },
    equipment: {
      controllers: [
        { id: createId(), model: 'SOLARTEC SC40', currentA: 40, price: 217.685, qty: 1 },
        { id: createId(), model: 'SOLARTEC SC20', currentA: 20, price: 141.9925, qty: 1 },
      ],
      inverter: {
        model: 'TGP 24 600',
        continuousW: 600,
        surgeW: 1200,
        inputV: 24,
        maxCurrentA: 11,
        price: 997.645,
      },
    },
    costs: {
      currency: 'USD',
      marginPct: 0,
      extras: [
        { id: createId(), category: 'cables', label: 'Cables', qty: 1, unitPrice: 650 },
        { id: createId(), category: 'tablero', label: 'Tablero', qty: 1, unitPrice: 550 },
        { id: createId(), category: 'soportes', label: 'Soportes', qty: 1, unitPrice: 800 },
        {
          id: createId(),
          category: 'instalacion',
          label: 'Instalación (7 días)',
          qty: 1,
          unitPrice: 1400,
        },
      ],
    },
  };
}

export function createEmptyConsumption() {
  return {
    id: createId(),
    name: '',
    qty: 1,
    watts: 0,
    winterHours: 0,
    summerHours: 0,
  };
}

export function createEmptyPanel() {
  return {
    id: createId(),
    model: '',
    powerW: 0,
    vmp: 0,
    voc: 0,
    isc: 0,
    imp: 0,
    tempCoeffVocPct: -0.3,
    tempC: 25,
    price: 0,
    qty: 1,
  };
}

export function createEmptyCost() {
  return {
    id: createId(),
    category: 'otros' as const,
    label: '',
    qty: 1,
    unitPrice: 0,
  };
}
