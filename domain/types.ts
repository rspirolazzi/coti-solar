export type ProviderId = 'photon' | 'google' | 'manual' | 'example';
export type RadiationProvider = 'pvgis' | 'nasa' | 'manual';

export interface ConsumptionItem {
  id: string;
  name: string;
  qty: number;
  watts: number;
  winterHours: number;
  summerHours: number;
}

export interface PanelItem {
  id: string;
  model: string;
  powerW: number;
  vmp: number;
  voc: number;
  isc: number;
  imp: number;
  tempCoeffVocPct: number;
  tempC: number;
  price: number;
  qty: number;
}

export interface BatteryModel {
  model: string;
  capacityAh: number;
  voltage: number;
  price: number;
}

export interface ControllerItem {
  id: string;
  model: string;
  currentA: number;
  price: number;
  qty: number;
}

export interface InverterItem {
  model: string;
  continuousW: number;
  surgeW: number;
  inputV: number;
  maxCurrentA: number;
  price: number;
}

export type CostCategory =
  | 'cables'
  | 'tablero'
  | 'soportes'
  | 'instalacion'
  | 'transporte'
  | 'otros';

export interface CostItem {
  id: string;
  category: CostCategory;
  label: string;
  qty: number;
  unitPrice: number;
}

export interface RadiationData {
  provider: RadiationProvider;
  database?: string;
  period?: string;
  tiltDeg: number;
  azimuthDeg: number;
  monthlyHsp: number[];
  optimalTiltDeg?: number;
  annualAverage?: number;
  fetchedAt?: string;
}

export interface LocationData {
  label: string;
  lat: number;
  lng: number;
  elevation?: number;
  country?: string;
  admin1?: string;
  source: ProviderId;
  radiation: RadiationData | null;
}

export interface ConsumptionSettings {
  items: ConsumptionItem[];
  powerFactor: number;
  securityFactor: number;
  systemEfficiency: number;
  cloudyDays: number;
  cloudyFrequency: number;
}

export interface PanelsSettings {
  items: PanelItem[];
  temperatureC: number;
  qtyMode: 'auto' | 'manual';
  qtyOverride?: number;
}

export interface BatterySettings {
  model: BatteryModel;
  autonomyDays: number;
  reserveDays: number;
  depthOfDischarge: number;
  dischargeEfficiency: number;
  inverterEfficiency: number;
  voltage?: number;
}

export interface EquipmentSettings {
  controllers: ControllerItem[];
  inverter: InverterItem;
}

export interface CostSettings {
  currency: 'USD';
  extras: CostItem[];
  marginPct: number;
}

export interface ProjectDraft {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  location: LocationData | null;
  consumption: ConsumptionSettings;
  panels: PanelsSettings;
  battery: BatterySettings;
  equipment: EquipmentSettings;
  costs: CostSettings;
}

export type Severity = 'warning' | 'error';

export interface CalculationIssue {
  code: string;
  message: string;
  severity: Severity;
  field?: string;
}

export interface ConsumptionResult {
  powerW: number;
  peakW: number;
  winterWhDay: number;
  summerWhDay: number;
  maxWhDay: number;
  energyToGenerateWhDay: number;
  extraWhDay: number;
  totalEnergyWhDay: number;
}

export interface MonthlyEnergy {
  month: number;
  label: string;
  hsp: number;
  demandWhDay: number;
  generationWhDay: number;
  coverage: number;
}

export interface PanelsResult {
  totalQty: number;
  requiredQty: number;
  series: number;
  parallel: number;
  nominalW: number;
  panelPowerW: number;
  monthly: MonthlyEnergy[];
  annualGenerationWh: number;
  annualDemandWh: number;
  annualCoverage: number;
}

export interface BatteryResult {
  voltage: number;
  suggestedVoltage: number;
  bankAh: number;
  qty: number;
  series: number;
  parallel: number;
  capacityAh: number;
  maxChargeA: number;
  maxDischargeA: number;
  c5A: number;
  c20A: number;
  totalPrice: number;
}

export interface EquipmentResult {
  requiredControllerA: number;
  controllerTotalA: number;
  controllerOk: boolean;
  requiredInverterVA: number;
  peakAcA: number;
  inverterContinuousOk: boolean;
  inverterPeakOk: boolean;
}

export interface CostsResult {
  panels: number;
  battery: number;
  controllers: number;
  inverter: number;
  equipmentSubtotal: number;
  extras: number;
  margin: number;
  total: number;
  currency: 'USD';
}

export interface CalculationResult {
  consumption: ConsumptionResult;
  panels: PanelsResult;
  battery: BatteryResult;
  equipment: EquipmentResult;
  costs: CostsResult;
  issues: CalculationIssue[];
  ready: boolean;
}
