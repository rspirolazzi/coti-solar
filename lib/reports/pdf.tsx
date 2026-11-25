/* eslint-disable jsx-a11y/alt-text */
import fs from 'node:fs';
import path from 'node:path';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';
import { MONTH_LABELS, calculateProject } from '@/domain/calculations';
import type { CalculationResult, ProjectDraft } from '@/domain/types';
import { formatCurrency, formatNumber } from '@/lib/format';

const publicPath = (...parts: string[]) =>
  path.join(process.cwd(), 'public', ...parts).replaceAll('\\', '/');
const toDataUri = (file: string) =>
  `data:image/png;base64,${fs.readFileSync(publicPath('brand', file)).toString('base64')}`;
const logoDark = toDataUri('cotisolar-isologo.png');
const logoLight = toDataUri('cotisolar-isologo-reverso-preview.png');
const renderLogo = process.env.NODE_ENV !== 'test';

const colors = {
  ink: '#0C2233',
  solar: '#F6A81C',
  close: '#0F7A5C',
  sand: '#F6F1E7',
  panel: '#64748B',
  line: '#E4DCCD',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, color: colors.ink, fontFamily: 'Helvetica', fontSize: 9 },
  cover: { backgroundColor: colors.ink, color: colors.white, padding: 44 },
  coverLogo: { width: 210, height: 48, marginBottom: 42 },
  eyebrow: { color: colors.solar, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' },
  coverTitle: { fontFamily: 'Helvetica-Bold', fontSize: 34, lineHeight: 1.08, marginTop: 12 },
  coverSubtitle: { color: '#A9B8C6', fontSize: 11, marginTop: 10 },
  coverBox: { marginTop: 44, backgroundColor: colors.white, color: colors.ink, borderRadius: 10, padding: 18 },
  coverLabel: { color: colors.panel, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1.2 },
  coverValue: { fontFamily: 'Helvetica-Bold', fontSize: 13, marginTop: 4, marginBottom: 14 },
  coverFooter: { position: 'absolute', left: 44, right: 44, bottom: 30, color: '#A9B8C6', fontSize: 8 },
  body: { padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo: { width: 150, height: 35 },
  pageLabel: { color: colors.panel, fontSize: 7, letterSpacing: 1.4, textTransform: 'uppercase' },
  h1: { fontFamily: 'Helvetica-Bold', fontSize: 19, marginBottom: 4 },
  h2: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginTop: 18, marginBottom: 8 },
  subtitle: { color: colors.panel, fontSize: 9, marginBottom: 14 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 5 },
  cellLabel: { width: '62%', color: colors.panel },
  cellValue: { width: '38%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  cards: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: { flex: 1, backgroundColor: colors.sand, borderRadius: 8, padding: 10 },
  cardLabel: { color: colors.panel, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardValue: { fontFamily: 'Helvetica-Bold', fontSize: 13, marginTop: 3 },
  tableHead: { flexDirection: 'row', backgroundColor: colors.ink, color: colors.white, paddingVertical: 5, paddingHorizontal: 4, borderRadius: 3 },
  th: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  td: { flex: 1, fontSize: 8, paddingVertical: 4 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 4 },
  total: { flexDirection: 'row', backgroundColor: colors.ink, color: colors.white, padding: 9, borderRadius: 4, marginTop: 8 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold' },
  totalValue: { color: colors.solar, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  badge: { backgroundColor: colors.sand, color: colors.ink, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, fontSize: 7, marginRight: 4 },
  warning: { color: '#8A5A00', backgroundColor: '#FFF6E0', padding: 7, borderRadius: 4, marginBottom: 4, fontSize: 8 },
  error: { color: '#8C1D18', backgroundColor: '#FDECEA', padding: 7, borderRadius: 4, marginBottom: 4, fontSize: 8 },
  footer: { position: 'absolute', left: 40, right: 40, bottom: 24, flexDirection: 'row', justifyContent: 'space-between', color: colors.panel, fontSize: 7 },
});

function Cover({
  project,
  calculation,
}: {
  project: ProjectDraft;
  calculation: CalculationResult;
}) {
  return (
    <Page size="A4" style={styles.cover}>
      {renderLogo ? <Image style={styles.coverLogo} src={logoLight} /> : null}
      <Text style={styles.eyebrow}>Reporte fotovoltaico</Text>
      <Text style={styles.coverTitle}>Dimensionamiento{'\n'}fotovoltaico</Text>
      <Text style={styles.coverSubtitle}>Sistema autónomo · off-grid</Text>

      <View style={styles.coverBox}>
        <Text style={styles.coverLabel}>Cliente / obra</Text>
        <Text style={styles.coverValue}>{project.name}</Text>
        <Text style={styles.coverLabel}>Ubicación</Text>
        <Text style={styles.coverValue}>{project.location?.label ?? 'Sin ubicación'}</Text>
        <Text style={styles.coverLabel}>Coordenadas</Text>
        <Text style={styles.coverValue}>
          {project.location
            ? `${project.location.lat.toFixed(5)}, ${project.location.lng.toFixed(5)}`
            : '—'}
        </Text>
        <Text style={styles.coverLabel}>Generado</Text>
        <Text style={styles.coverValue}>
          {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date())}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.coverLabel}>Consumo máximo</Text>
          <Text style={styles.coverValue}>{formatNumber(calculation.consumption.maxWhDay, 0)} Wh/día</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.coverLabel}>Potencia FV</Text>
          <Text style={styles.coverValue}>{formatNumber(calculation.panels.nominalW, 0)} W</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.coverLabel}>Inversión</Text>
          <Text style={styles.coverValue}>{formatCurrency(calculation.costs.total)}</Text>
        </View>
      </View>

      <Text style={styles.coverFooter}>CotiSolar: la cuenta que cierra. · cotisolar.com</Text>
    </Page>
  );
}

function Details({
  project,
  calculation,
}: {
  project: ProjectDraft;
  calculation: CalculationResult;
}) {
  const radiation = project.location?.radiation;
  return (
    <Page size="A4" style={styles.body}>
      <View style={styles.header}>
        {renderLogo ? <Image style={styles.logo} src={logoDark} /> : null}
        <Text style={styles.pageLabel}>Resumen · 2/3</Text>
      </View>
      <Text style={styles.h1}>Resumen del sistema</Text>
      <Text style={styles.subtitle}>{project.name}</Text>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Consumo máximo</Text>
          <Text style={styles.cardValue}>{formatNumber(calculation.consumption.maxWhDay, 0)} Wh/día</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Paneles</Text>
          <Text style={styles.cardValue}>{calculation.panels.totalQty} × {formatNumber(calculation.panels.panelPowerW, 0)} W</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Banco</Text>
          <Text style={styles.cardValue}>{formatNumber(calculation.battery.capacityAh, 0)} Ah</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total</Text>
          <Text style={styles.cardValue}>{formatCurrency(calculation.costs.total)}</Text>
        </View>
      </View>

      <Text style={styles.h2}>Consumo y energía</Text>
      {[
        ['Potencia total', `${formatNumber(calculation.consumption.powerW, 0)} W`],
        ['Consumo invierno', `${formatNumber(calculation.consumption.winterWhDay, 0)} Wh/día`],
        ['Consumo verano', `${formatNumber(calculation.consumption.summerWhDay, 0)} Wh/día`],
        ['Energía a generar', `${formatNumber(calculation.consumption.energyToGenerateWhDay, 0)} Wh/día`],
        ['Energía total diaria', `${formatNumber(calculation.consumption.totalEnergyWhDay, 0)} Wh/día`],
      ].map(([label, value]) => (
        <View style={styles.row} key={label}>
          <Text style={styles.cellLabel}>{label}</Text>
          <Text style={styles.cellValue}>{value}</Text>
        </View>
      ))}

      <Text style={styles.h2}>Sistema fotovoltaico</Text>
      {[
        ['Arreglo', `${calculation.panels.series} serie × ${calculation.panels.parallel} paralelo`],
        ['Generación anual', `${formatNumber(calculation.panels.annualGenerationWh / 1000, 0)} kWh`],
        ['Cobertura anual', `${formatNumber(calculation.panels.annualCoverage * 100, 0)}%`],
        ['Baterías', `${calculation.battery.qty} (${calculation.battery.series} serie × ${calculation.battery.parallel} paralelo)`],
        ['Regulador requerido', `${formatNumber(calculation.equipment.requiredControllerA, 1)} A`],
        ['Inversor requerido', `${formatNumber(calculation.equipment.requiredInverterVA, 0)} VA`],
      ].map(([label, value]) => (
        <View style={styles.row} key={label}>
          <Text style={styles.cellLabel}>{label}</Text>
          <Text style={styles.cellValue}>{value}</Text>
        </View>
      ))}

      {radiation ? (
        <>
          <Text style={styles.h2}>Radiación</Text>
          <Text style={styles.subtitle}>
            {radiation.provider.toUpperCase()} · {radiation.database} · {radiation.period} · inclinación {radiation.tiltDeg}°
            {radiation.optimalTiltDeg !== undefined ? ` · óptima ${radiation.optimalTiltDeg}°` : ''}
          </Text>
          <View style={styles.tableHead}>
            <Text style={styles.th}>Mes</Text>
            {MONTH_LABELS.map((month) => (
              <Text key={month} style={styles.th}>{month}</Text>
            ))}
          </View>
          <View style={styles.tr}>
            <Text style={styles.td}>HSP</Text>
            {radiation.monthlyHsp.map((value, index) => (
              <Text key={index} style={styles.td}>{formatNumber(value, 1)}</Text>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.footer}>
        <Text>CotiSolar: la cuenta que cierra.</Text>
        <Text>Fuente: PVGIS © European Union, 2001–2026 / NASA POWER</Text>
      </View>
    </Page>
  );
}

function CostsPage({
  project,
  calculation,
}: {
  project: ProjectDraft;
  calculation: CalculationResult;
}) {
  return (
    <Page size="A4" style={styles.body}>
      <View style={styles.header}>
        {renderLogo ? <Image style={styles.logo} src={logoDark} /> : null}
        <Text style={styles.pageLabel}>Presupuesto · 3/3</Text>
      </View>
      <Text style={styles.h1}>Presupuesto de equipos</Text>
      <Text style={styles.subtitle}>{project.name}</Text>

      <View style={styles.tableHead}>
        <Text style={[styles.th, { flex: 2 }]}>Componente</Text>
        <Text style={styles.th}>Cantidad</Text>
        <Text style={styles.th}>Precio</Text>
      </View>
      {[
        [`Paneles ${project.panels.items[0]?.model ?? ''}`, calculation.panels.totalQty, calculation.costs.panels],
        [`Baterías ${project.battery.model.model}`, calculation.battery.qty, calculation.costs.battery],
        ['Reguladores de carga', project.equipment.controllers.reduce((total, c) => total + c.qty, 0), calculation.costs.controllers],
        ['Inversor', 1, calculation.costs.inverter],
      ].map(([label, qty, price]) => (
        <View style={styles.tr} key={String(label)}>
          <Text style={[styles.td, { flex: 2 }]}>{label}</Text>
          <Text style={styles.td}>{qty}</Text>
          <Text style={styles.td}>{formatCurrency(Number(price))}</Text>
        </View>
      ))}
      {project.costs.extras.map((extra) => (
        <View style={styles.tr} key={extra.id}>
          <Text style={[styles.td, { flex: 2 }]}>{extra.label}</Text>
          <Text style={styles.td}>{extra.qty}</Text>
          <Text style={styles.td}>{formatCurrency(extra.qty * extra.unitPrice)}</Text>
        </View>
      ))}

      <View style={styles.total}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatCurrency(calculation.costs.total)}</Text>
      </View>

      <Text style={styles.h2}>Advertencias y supuestos</Text>
      {calculation.issues.map((issue) => (
        <Text key={issue.code} style={issue.severity === 'error' ? styles.error : styles.warning}>
          {issue.message}
        </Text>
      ))}
      {calculation.issues.length === 0 ? (
        <Text style={styles.subtitle}>Sin advertencias. Revisá los datos de entrada antes de comprar.</Text>
      ) : null}
      <Text style={styles.subtitle}>
        Radiación: {project.location?.radiation?.database ?? 'sin dato'} · {project.location?.radiation?.period ?? '—'}.
        Los valores son estimaciones y deben ser validados por un profesional.
      </Text>

      <View style={styles.footer}>
        <Text>CotiSolar: la cuenta que cierra.</Text>
        <Text>cotisolar.com</Text>
      </View>
    </Page>
  );
}

export async function buildPdf(project: ProjectDraft): Promise<Buffer> {
  const calculation = calculateProject(project);
  return renderToBuffer(
    <Document>
      <Cover project={project} calculation={calculation} />
      <Details project={project} calculation={calculation} />
      <CostsPage project={project} calculation={calculation} />
    </Document>,
  );
}
