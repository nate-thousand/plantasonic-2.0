/**
 * Patches are engine snapshots kept in localStorage. Save and recall is
 * `getSnapshot()` / `applySnapshot()`; the instrument only names and lists them.
 */
import type { EngineSnapshot } from 'plantasia-sound-engine/public';

export type Patch = { id: string; name: string; savedAt: string; snapshot: EngineSnapshot };

const KEY = 'plantasonic.patches';

function read(): Patch[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Patch[]) : [];
  } catch {
    return [];
  }
}

function write(patches: Patch[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(patches));
  } catch {
    /* private mode or full: patches are session-only then */
  }
}

export function listPatches(): Patch[] {
  return read();
}

export function savePatch(snapshot: EngineSnapshot, name?: string): Patch {
  const patches = read();
  const n = patches.length + 1;
  const patch: Patch = {
    id: `${Date.now().toString(36)}`,
    name: name ?? `${snapshot.speciesId} ${String(n).padStart(2, '0')}`,
    savedAt: new Date().toISOString(),
    snapshot,
  };
  write([patch, ...patches].slice(0, 24));
  return patch;
}

export function deletePatch(id: string): void {
  write(read().filter((p) => p.id !== id));
}
