'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Crosshair, Loader2, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { StepPage } from '@/components/wizard/step-page';
import { RadiationChart } from '@/components/charts/radiation-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, NumberInput, Select } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { useProject, useProjectStore } from '@/lib/store';
import type { LocationData, RadiationData } from '@/domain/types';
import { formatNumber } from '@/lib/format';

const LocationMap = dynamic(() => import('@/components/map/location-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-line bg-sand text-sm text-panel">
      Cargando mapa…
    </div>
  ),
});

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  country?: string;
  admin1?: string;
}

const AZIMUTHS = [
  { value: -180, label: 'Norte' },
  { value: -135, label: 'Noreste' },
  { value: -90, label: 'Este' },
  { value: -45, label: 'Sureste' },
  { value: 0, label: 'Sur' },
  { value: 45, label: 'Suroeste' },
  { value: 90, label: 'Oeste' },
  { value: 135, label: 'Noroeste' },
];

export function LocationStep() {
  const project = useProject();
  const setLocation = useProjectStore((state) => state.setLocation);
  const setRadiation = useProjectStore((state) => state.setRadiation);
  const radiation = project.location?.radiation;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapBusy, setMapBusy] = useState(false);
  const [error, setError] = useState('');
  const [tilt, setTilt] = useState(radiation?.tiltDeg ?? 30);
  const [azimuth, setAzimuth] = useState(
    radiation?.azimuthDeg ?? (project.location?.lat && project.location.lat >= 0 ? 0 : -180),
  );
  const [coords, setCoords] = useState({
    lat: project.location?.lat ?? '',
    lng: project.location?.lng ?? '',
  });
  const [manualHsp, setManualHsp] = useState<number[]>(radiation?.monthlyHsp ?? Array(12).fill(0));
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    if (!radiation) return;
    // Sincroniza los controles locales cuando llega una nueva respuesta de radiación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTilt(radiation.tiltDeg);
    setAzimuth(radiation.azimuthDeg);
    setManualHsp(radiation.monthlyHsp);
  }, [radiation, project.location?.lat, project.location?.lng]);

  const fetchRadiation = useCallback(
    async (lat: number, lng: number, nextTilt?: number, nextAzimuth?: number) => {
      const params = new URLSearchParams({ lat: String(lat), lon: String(lng) });
      if (typeof nextTilt === 'number') params.set('tilt', String(nextTilt));
      if (typeof nextAzimuth === 'number') params.set('azimuth', String(nextAzimuth));
      const response = await fetch(`/api/radiation?${params.toString()}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message || 'No pudimos obtener la radiación.');
      }
      return (await response.json()) as RadiationData;
    },
    [],
  );

  const applyLocation = useCallback(
    async (result: GeocodeResult, source: LocationData['source']) => {
      const nextLocation: LocationData = {
        label: result.label,
        lat: result.lat,
        lng: result.lng,
        country: result.country,
        admin1: result.admin1,
        source,
        radiation: null,
      };
      setLocation(nextLocation);
      setCoords({ lat: result.lat, lng: result.lng });
      setResults([]);
      setQuery('');
      setError('');
      setMapBusy(true);
      try {
        const nextRadiation = await fetchRadiation(result.lat, result.lng);
        setRadiation(nextRadiation);
        setTilt(nextRadiation.tiltDeg);
        setAzimuth(nextRadiation.azimuthDeg);
        setManualHsp(nextRadiation.monthlyHsp);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No pudimos obtener la radiación.');
        toast.error('Radiación no disponible. Podés cargar HSP manual.');
      } finally {
        setMapBusy(false);
      }
    },
    [fetchRadiation, setLocation, setRadiation],
  );

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    setSearching(true);
    setError('');
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('No pudimos buscar esa dirección.');
      const payload = (await response.json()) as { results?: GeocodeResult[] };
      setResults(payload.results ?? []);
      if (!payload.results?.length) setError('No encontramos resultados. Probá con otra dirección o coordenadas.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error de búsqueda.');
    } finally {
      setSearching(false);
    }
  }

  async function pickOnMap(lat: number, lng: number) {
    setMapBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      const payload = response.ok
        ? ((await response.json()) as { results?: GeocodeResult[] })
        : { results: [] };
      const label = payload.results?.[0]?.label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      await applyLocation(
        {
          label,
          lat,
          lng,
          country: payload.results?.[0]?.country,
          admin1: payload.results?.[0]?.admin1,
        },
        payload.results?.length ? 'photon' : 'manual',
      );
    } catch {
      await applyLocation({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng }, 'manual');
    } finally {
      setMapBusy(false);
    }
  }

  function applyCoordinates() {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setError('Ingresá coordenadas válidas: latitud entre -90 y 90, longitud entre -180 y 180.');
      return;
    }
    void applyLocation(
      { label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng },
      'manual',
    );
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        void pickOnMap(position.coords.latitude, position.coords.longitude),
      () => setError('No pudimos obtener tu ubicación. Revisá el permiso del navegador.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function updateTilt(nextTilt: number, nextAzimuth = azimuth) {
    setTilt(nextTilt);
    setAzimuth(nextAzimuth);
    if (!project.location) return;
    setMapBusy(true);
    try {
      const nextRadiation = await fetchRadiation(project.location.lat, project.location.lng, nextTilt, nextAzimuth);
      setRadiation({
        ...nextRadiation,
        optimalTiltDeg: radiation?.optimalTiltDeg ?? nextRadiation.optimalTiltDeg,
      });
      setManualHsp(nextRadiation.monthlyHsp);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos recalcular la radiación.');
    } finally {
      setMapBusy(false);
    }
  }

  async function useOptimalTilt() {
    if (!project.location) return;
    setMapBusy(true);
    try {
      const nextRadiation = await fetchRadiation(project.location.lat, project.location.lng);
      setRadiation(nextRadiation);
      setTilt(nextRadiation.tiltDeg);
      setAzimuth(nextRadiation.azimuthDeg);
      setManualHsp(nextRadiation.monthlyHsp);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos obtener la inclinación óptima.');
    } finally {
      setMapBusy(false);
    }
  }

  function saveManualHsp() {
    const manualRadiation: RadiationData = {
      provider: 'manual',
      database: 'Manual',
      period: 'Manual',
      tiltDeg: tilt,
      azimuthDeg: azimuth,
      monthlyHsp: manualHsp,
      fetchedAt: new Date().toISOString(),
    };
    if (project.location) {
      setRadiation(manualRadiation);
    } else {
      setLocation({
        label: 'Ubicación manual',
        lat: 0,
        lng: 0,
        source: 'manual',
        radiation: manualRadiation,
      });
    }
    toast.success('HSP manual guardado.');
  }

  const blockedReason = !radiation
    ? 'Elegí una ubicación o cargá HSP manual para continuar.'
    : undefined;

  return (
    <StepPage
      title="Ubicación y radiación"
      description="Buscá una dirección, hacé clic en el mapa o pegá coordenadas. Después elegí la inclinación y revisá la radiación mensual."
      nextHref="/calculadora/consumo"
      blockedReason={blockedReason}
    >
      <div className="space-y-5">
        <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-panel" />
            <input
              className="field pl-9"
              placeholder="Ciudad, dirección o localidad"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar ubicación"
            />
          </div>
          <Button type="submit" disabled={searching || query.trim().length < 2}>
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Buscar
          </Button>
        </form>

        {results.length > 0 ? (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {results.map((result) => (
              <li key={`${result.lat}-${result.lng}-${result.label}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-sand"
                  onClick={() => void applyLocation(result, 'photon')}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-solar" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{result.label}</span>
                    <span className="block text-xs text-panel">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                      {result.admin1 ? ` · ${result.admin1}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-2">
            <LocationMap
              lat={project.location?.lat}
              lng={project.location?.lng}
              onPick={(lat, lng) => void pickOnMap(lat, lng)}
            />
            <p className="text-xs text-panel">
              Hacé clic o arrastrá el pin para ajustar el punto exacto. Mapa: OpenFreeMap /
              OpenStreetMap.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-sand/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Coordenadas</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useGeolocation}
                disabled={mapBusy}
              >
                <Crosshair className="size-4" />
                Mi ubicación
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitud" htmlFor="lat">
                <NumberInput
                  id="lat"
                  value={coords.lat === '' ? 0 : Number(coords.lat)}
                  onValueChange={(value) => setCoords((prev) => ({ ...prev, lat: value }))}
                  step="0.000001"
                />
              </Field>
              <Field label="Longitud" htmlFor="lng">
                <NumberInput
                  id="lng"
                  value={coords.lng === '' ? 0 : Number(coords.lng)}
                  onValueChange={(value) => setCoords((prev) => ({ ...prev, lng: value }))}
                  step="0.000001"
                />
              </Field>
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={applyCoordinates}>
              Usar estas coordenadas
            </Button>
            {project.location ? (
              <div className="text-xs leading-5 text-panel">
                <p className="font-semibold text-ink">{project.location.label}</p>
                <p>
                  {project.location.lat.toFixed(5)}, {project.location.lng.toFixed(5)}
                  {project.location.elevation ? ` · ${project.location.elevation} m` : ''}
                </p>
              </div>
            ) : (
              <p className="text-xs text-panel">Todavía no hay una ubicación seleccionada.</p>
            )}
          </div>
        </div>

        {error ? <Alert variant="error" title="No pudimos completar la ubicación">{error}</Alert> : null}

        {radiation ? (
          <div className="space-y-4 rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-semibold text-ink">Radiación del sitio</p>
                  <Badge variant="solar">{radiation.provider.toUpperCase()}</Badge>
                  {radiation.database ? <Badge>{radiation.database}</Badge> : null}
                  {radiation.period ? <Badge>{radiation.period}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-panel">
                  Media anual {formatNumber(radiation.annualAverage ?? 0, 2)} kWh/m²/día
                  {radiation.optimalTiltDeg !== undefined
                    ? ` · inclinación óptima ${radiation.optimalTiltDeg}°`
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={useOptimalTilt}
                disabled={mapBusy}
              >
                Usar inclinación óptima
              </Button>
            </div>

            <RadiationChart values={radiation.monthlyHsp} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="tilt">
                  Inclinación: {tilt}°
                </label>
                <input
                  id="tilt"
                  type="range"
                  min={0}
                  max={90}
                  value={tilt}
                  onChange={(event) => setTilt(Number(event.target.value))}
                  onMouseUp={() => void updateTilt(tilt)}
                  onTouchEnd={() => void updateTilt(tilt)}
                  onKeyUp={() => void updateTilt(tilt)}
                  className="w-full accent-solar"
                />
                <p className="mt-1 text-xs text-panel">
                  La inclinación óptima calculada es {radiation.optimalTiltDeg ?? '—'}°.
                </p>
              </div>
              <Field label="Orientación" htmlFor="azimuth">
                <Select
                  id="azimuth"
                  value={azimuth}
                  onChange={(event) => void updateTilt(tilt, Number(event.target.value))}
                >
                  {AZIMUTHS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <p className="text-xs leading-5 text-panel">
              Fuente: {radiation.provider === 'pvgis' ? 'PVGIS © European Union, 2001–2026' : 'NASA POWER'}.
              Los valores pueden variar según la base y el período. Si no confiás en el dato,
              cargá HSP manual.
            </p>

            {radiation.provider === 'nasa' ? (
              <Alert variant="warning" title="Radiación de respaldo">
                NASA POWER devuelve irradiación horizontal, no sobre el plano inclinado. Usalo
                solo como referencia hasta recuperar PVGIS o cargar HSP manual.
              </Alert>
            ) : null}

            <details
              className="rounded-lg border border-line bg-sand/50 p-3"
              open={manualOpen}
              onToggle={(event) => setManualOpen((event.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                <SlidersHorizontal className="mr-1 inline size-4" />
                Cargar HSP manual
              </summary>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {manualHsp.map((value, index) => (
                  <Field key={index} label={`Mes ${index + 1}`} htmlFor={`hsp-${index}`}>
                    <NumberInput
                      id={`hsp-${index}`}
                      value={value}
                      step="0.01"
                      onValueChange={(next) =>
                        setManualHsp((prev) => prev.map((item, itemIndex) => (itemIndex === index ? next : item)))
                      }
                    />
                  </Field>
                ))}
              </div>
              <Button type="button" variant="secondary" className="mt-3" onClick={saveManualHsp}>
                Guardar HSP manual
              </Button>
            </details>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert variant="warning" title="Radiación pendiente">
              Elegí una ubicación para consultar PVGIS. Si el proveedor falla, podés cargar HSP
              manual desde el detalle.
            </Alert>
            <details className="rounded-lg border border-line bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                <SlidersHorizontal className="mr-1 inline size-4" />
                Cargar HSP manual
              </summary>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {manualHsp.map((value, index) => (
                  <Field key={index} label={`Mes ${index + 1}`} htmlFor={`manual-hsp-${index}`}>
                    <NumberInput
                      id={`manual-hsp-${index}`}
                      value={value}
                      step="0.01"
                      onValueChange={(next) =>
                        setManualHsp((prev) =>
                          prev.map((item, itemIndex) => (itemIndex === index ? next : item)),
                        )
                      }
                    />
                  </Field>
                ))}
              </div>
              <Button type="button" variant="secondary" className="mt-3" onClick={saveManualHsp}>
                Guardar HSP manual
              </Button>
            </details>
          </div>
        )}
      </div>
    </StepPage>
  );
}
