'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/lib/store';

export function StoreHydrator() {
  useEffect(() => {
    const finish = () => useProjectStore.getState().setHydrated(true);
    try {
      void Promise.resolve(useProjectStore.persist.rehydrate()).then(finish).catch(finish);
    } catch {
      finish();
    }
    // Si el storage del navegador no está disponible, no dejamos la UI bloqueada.
    const timer = window.setTimeout(finish, 400);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
