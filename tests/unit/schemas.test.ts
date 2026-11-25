import { describe, expect, it } from 'vitest';
import { projectSchema } from '@/domain/schemas';
import { createExampleProject, createProject } from '@/domain/defaults';

describe('esquema de proyecto', () => {
  it('acepta un proyecto nuevo', () => {
    const parsed = projectSchema.safeParse(createProject());
    expect(parsed.success).toBe(true);
  });

  it('acepta el ejemplo completo', () => {
    const parsed = projectSchema.safeParse(createExampleProject());
    expect(parsed.success).toBe(true);
  });

  it('rechaza coordenadas fuera de rango', () => {
    const project = createExampleProject();
    project.location!.lat = 120;
    expect(projectSchema.safeParse(project).success).toBe(false);
  });

  it('rechaza una radiación incompleta', () => {
    const project = createExampleProject();
    project.location!.radiation!.monthlyHsp = [1, 2, 3];
    expect(projectSchema.safeParse(project).success).toBe(false);
  });
});
