'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createExampleProject, createProject } from '@/domain/defaults';
import type { LocationData, ProjectDraft, RadiationData } from '@/domain/types';

interface ProjectState {
  project: ProjectDraft;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  newProject: () => void;
  loadExample: () => void;
  replaceProject: (project: ProjectDraft) => void;
  updateProject: (patch: Partial<ProjectDraft>) => void;
  updateName: (name: string) => void;
  setLocation: (location: LocationData | null) => void;
  setRadiation: (radiation: RadiationData | null) => void;
}

const initialProject = createProject();

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: initialProject,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      newProject: () => set({ project: createProject() }),
      loadExample: () => set({ project: createExampleProject() }),
      replaceProject: (project) =>
        set({ project: { ...project, updatedAt: new Date().toISOString() } }),
      updateProject: (patch) =>
        set((state) => ({
          project: {
            ...state.project,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        })),
      updateName: (name) =>
        set((state) => ({
          project: { ...state.project, name, updatedAt: new Date().toISOString() },
        })),
      setLocation: (location) =>
        set((state) => ({
          project: { ...state.project, location, updatedAt: new Date().toISOString() },
        })),
      setRadiation: (radiation) =>
        set((state) => ({
          project: {
            ...state.project,
            location: state.project.location ? { ...state.project.location, radiation } : null,
            updatedAt: new Date().toISOString(),
          },
        })),
    }),
    {
      name: 'cotisolar:project:v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      partialize: (state) => ({ project: state.project }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function useProject() {
  return useProjectStore((state) => state.project);
}

export function useStoreHydrated() {
  return useProjectStore((state) => state.hydrated);
}
