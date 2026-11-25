'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function LocationMap({
  lat,
  lng,
  onPick,
}: {
  lat?: number | null;
  lng?: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
    const center: [number, number] =
      Number.isFinite(lat) && Number.isFinite(lng) ? [lng as number, lat as number] : [-58.45, -34.58];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center,
      zoom: 11,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    });
    geolocate.on('geolocate', (event) => {
      const point = event as unknown as { coords: { latitude: number; longitude: number } };
      marker.setLngLat([point.coords.longitude, point.coords.latitude]);
      onPickRef.current(point.coords.latitude, point.coords.longitude);
    });
    map.addControl(geolocate, 'top-right');

    const marker = new maplibregl.Marker({ color: '#F6A81C', draggable: true })
      .setLngLat(center)
      .addTo(map);
    marker.on('dragend', () => {
      const point = marker.getLngLat();
      onPickRef.current(point.lat, point.lng);
    });
    map.on('click', (event: maplibregl.MapMouseEvent) => {
      marker.setLngLat(event.lngLat);
      onPickRef.current(event.lngLat.lat, event.lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // El mapa se inicializa una sola vez; los cambios de coordenadas usan el efecto siguiente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([lng as number, lat as number]);
    map.easeTo({ center: [lng as number, lat as number], duration: 450 });
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-[280px] w-full overflow-hidden rounded-xl border border-line sm:h-[320px]"
      aria-label="Mapa para elegir la ubicación"
      role="application"
    />
  );
}
