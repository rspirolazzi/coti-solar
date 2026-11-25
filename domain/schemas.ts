import { z } from 'zod';

const nonNegative = z.number().finite().min(0);
const positive = z.number().finite().positive();

export const consumptionItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  qty: z.number().finite().int().min(1).max(10000),
  watts: nonNegative.max(1_000_000),
  winterHours: z.number().finite().min(0).max(24),
  summerHours: z.number().finite().min(0).max(24),
});

export const panelItemSchema = z.object({
  id: z.string().min(1),
  model: z.string().trim().max(160),
  powerW: nonNegative.max(100_000),
  vmp: nonNegative.max(1000),
  voc: nonNegative.max(1000),
  isc: nonNegative.max(1000),
  imp: nonNegative.max(1000),
  tempCoeffVocPct: z.number().finite().min(-2).max(2),
  tempC: z.number().finite().min(-40).max(100),
  price: nonNegative,
  qty: z.number().finite().int().min(1).max(10000),
});

export const batteryModelSchema = z.object({
  model: z.string().trim().max(160),
  capacityAh: positive.max(100_000),
  voltage: positive.max(1000),
  price: nonNegative,
});

export const controllerSchema = z.object({
  id: z.string().min(1),
  model: z.string().trim().max(160),
  currentA: positive.max(1000),
  price: nonNegative,
  qty: z.number().finite().int().min(1).max(100),
});

export const inverterSchema = z.object({
  model: z.string().trim().max(160),
  continuousW: nonNegative.max(1_000_000),
  surgeW: nonNegative.max(2_000_000),
  inputV: nonNegative.max(1000),
  maxCurrentA: nonNegative.max(1000),
  price: nonNegative,
});

export const costItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['cables', 'tablero', 'soportes', 'instalacion', 'transporte', 'otros']),
  label: z.string().trim().min(1).max(160),
  qty: nonNegative,
  unitPrice: nonNegative,
});

export const radiationSchema = z.object({
  provider: z.enum(['pvgis', 'nasa', 'manual']),
  database: z.string().optional(),
  period: z.string().optional(),
  tiltDeg: z.number().finite().min(0).max(90),
  azimuthDeg: z.number().finite().min(-180).max(180),
  monthlyHsp: z.array(nonNegative.max(24)).length(12),
  optimalTiltDeg: z.number().finite().min(0).max(90).optional(),
  annualAverage: z.number().finite().min(0).optional(),
  fetchedAt: z.string().optional(),
});

export const locationSchema = z.object({
  label: z.string().trim().min(1).max(300),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  elevation: z.number().finite().optional(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  source: z.enum(['photon', 'google', 'manual', 'example']),
  radiation: radiationSchema.nullable(),
});

export const projectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  location: locationSchema.nullable(),
  consumption: z.object({
    items: z.array(consumptionItemSchema).max(500),
    powerFactor: z.number().finite().min(0.1).max(1),
    securityFactor: z.number().finite().min(100).max(200),
    systemEfficiency: z.number().finite().min(10).max(100),
    cloudyDays: z.number().finite().min(0).max(30),
    cloudyFrequency: z.number().finite().min(1).max(31),
  }),
  panels: z.object({
    items: z.array(panelItemSchema).max(100),
    temperatureC: z.number().finite().min(-40).max(100),
    qtyMode: z.enum(['auto', 'manual']),
    qtyOverride: z.number().finite().int().min(1).max(10000).optional(),
  }),
  battery: z.object({
    model: batteryModelSchema,
    autonomyDays: z.number().finite().min(0).max(30),
    reserveDays: z.number().finite().min(0).max(30),
    depthOfDischarge: z.number().finite().min(10).max(100),
    dischargeEfficiency: z.number().finite().min(10).max(100),
    inverterEfficiency: z.number().finite().min(10).max(100),
    voltage: z.number().finite().positive().max(1000).optional(),
  }),
  equipment: z.object({
    controllers: z.array(controllerSchema).max(20),
    inverter: inverterSchema,
  }),
  costs: z.object({
    currency: z.literal('USD'),
    extras: z.array(costItemSchema).max(100),
    marginPct: z.number().finite().min(0).max(100),
  }),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export function validateProject(value: unknown) {
  return projectSchema.safeParse(value);
}

export function parseProject(value: unknown) {
  return projectSchema.parse(value);
}
