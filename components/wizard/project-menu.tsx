'use client';

import { useRef, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, FilePlus2, FolderOpen, MoreHorizontal, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { projectSchema } from '@/domain/schemas';
import { useProjectStore } from '@/lib/store';
import { downloadBlob, slugify } from '@/lib/format';

export function ProjectMenu() {
  const [confirmNew, setConfirmNew] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const project = useProjectStore((state) => state.project);
  const newProject = useProjectStore((state) => state.newProject);
  const loadExample = useProjectStore((state) => state.loadExample);
  const replaceProject = useProjectStore((state) => state.replaceProject);

  function exportJson() {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `cotisolar-${slugify(project.name) || 'calculo'}.json`);
  }

  async function importJson(file: File) {
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const parsed = projectSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error('El archivo no tiene el formato de CotiSolar.');
        return;
      }
      replaceProject(parsed.data);
      toast.success('Cálculo importado.');
    } catch {
      toast.error('No pudimos leer el archivo JSON.');
    }
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            aria-label="Menú del cálculo"
          >
            <MoreHorizontal className="size-5" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-52 rounded-xl border border-line bg-white p-1.5 shadow-xl"
          >
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink outline-none hover:bg-sand"
              onSelect={() => setConfirmNew(true)}
            >
              <FilePlus2 className="size-4" /> Nuevo cálculo
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink outline-none hover:bg-sand"
              onSelect={loadExample}
            >
              <Sparkles className="size-4" /> Cargar ejemplo
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink outline-none hover:bg-sand"
              onSelect={() => inputRef.current?.click()}
            >
              <FolderOpen className="size-4" /> Importar JSON
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink outline-none hover:bg-sand"
              onSelect={exportJson}
            >
              <Download className="size-4" /> Exportar JSON
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importJson(file);
          event.currentTarget.value = '';
        }}
      />

      <Dialog open={confirmNew} onOpenChange={setConfirmNew}>
        <DialogContent>
          <DialogTitle>¿Empezar un cálculo nuevo?</DialogTitle>
          <DialogDescription>
            Se reemplaza el borrador actual. Podés exportarlo antes desde el menú.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmNew(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                newProject();
                setConfirmNew(false);
              }}
            >
              <Upload className="size-4" />
              Empezar de cero
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
