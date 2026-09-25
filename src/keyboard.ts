/**
 * The keys: seventeen notes from C3 to E4 on screen, the same seventeen on the
 * computer keyboard (a to ; with the black keys on w e t y u o p), multi-touch,
 * with glide across keys and velocity from where on the key you land.
 */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const FIRST_MIDI = 48; // C3
export const KEY_COUNT = 17; // C3 .. E4

export type Key = { midi: number; note: string; black: boolean; index: number };

export function noteName(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export const KEYS: Key[] = Array.from({ length: KEY_COUNT }, (_, i) => {
  const midi = FIRST_MIDI + i;
  return { midi, note: noteName(midi), black: NAMES[midi % 12].includes('#'), index: i };
});

/** Computer keys, semitone offsets from the first key. */
const COMPUTER: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16,
};

export type KeyboardHandlers = {
  noteOn: (note: string, velocity: number, index: number) => void;
  noteOff: (note: string) => void;
};

export function renderKeyboard(): string {
  return `<div class="ps-piano pl-keys" role="group" aria-label="Keys, C3 to E4">${KEYS.map(
    (k) =>
      `<button type="button" class="ps-piano__key${k.black ? ' ps-piano__key--black' : ''}" data-note="${k.note}" data-index="${k.index}" aria-label="${k.note}">${k.black ? '' : `<span class="pl-keys__name">${k.note.replace(/\d/, '')}</span>`}</button>`,
  ).join('')}</div>`;
}

/**
 * Pointer and computer-keyboard input on a rendered keyboard. Returns a cleanup function.
 */
export function bindKeyboard(root: HTMLElement, handlers: KeyboardHandlers): () => void {
  const piano = root.querySelector<HTMLElement>('.pl-keys');
  if (!piano) return () => {};

  const byPointer = new Map<number, HTMLElement>();
  const byComputer = new Map<string, string>();
  let octaveShift = 0;

  const keyAt = (x: number, y: number): HTMLElement | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const key = el?.closest<HTMLElement>('.ps-piano__key');
    return key && piano.contains(key) ? key : null;
  };

  const velocityAt = (key: HTMLElement, y: number): number => {
    const r = key.getBoundingClientRect();
    const t = r.height ? (y - r.top) / r.height : 0.75;
    return 0.45 + 0.55 * Math.min(1, Math.max(0, t));
  };

  const press = (key: HTMLElement, velocity: number): void => {
    key.classList.add('ps-piano__key--active');
    handlers.noteOn(key.dataset.note!, velocity, Number(key.dataset.index));
  };

  const release = (key: HTMLElement): void => {
    key.classList.remove('ps-piano__key--active');
    handlers.noteOff(key.dataset.note!);
  };

  const onDown = (e: PointerEvent): void => {
    const key = keyAt(e.clientX, e.clientY);
    if (!key) return;
    e.preventDefault();
    byPointer.set(e.pointerId, key);
    press(key, velocityAt(key, e.clientY));
  };

  const onMove = (e: PointerEvent): void => {
    const current = byPointer.get(e.pointerId);
    if (!current) return;
    const key = keyAt(e.clientX, e.clientY);
    if (key === current) return;
    release(current);
    if (key) {
      byPointer.set(e.pointerId, key);
      press(key, velocityAt(key, e.clientY));
    } else {
      byPointer.delete(e.pointerId);
    }
  };

  const onUp = (e: PointerEvent): void => {
    const current = byPointer.get(e.pointerId);
    if (!current) return;
    byPointer.delete(e.pointerId);
    release(current);
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'z') { octaveShift = Math.max(-2, octaveShift - 1); return; }
    if (k === 'x') { octaveShift = Math.min(2, octaveShift + 1); return; }
    const offset = COMPUTER[k];
    if (offset === undefined || byComputer.has(k)) return;
    const midi = FIRST_MIDI + offset + octaveShift * 12;
    const note = noteName(midi);
    byComputer.set(k, note);
    const onScreen = piano.querySelector<HTMLElement>(`[data-note="${note}"]`);
    onScreen?.classList.add('ps-piano__key--active');
    handlers.noteOn(note, 0.8, offset);
    e.preventDefault();
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    const note = byComputer.get(k);
    if (!note) return;
    byComputer.delete(k);
    piano.querySelector<HTMLElement>(`[data-note="${note}"]`)?.classList.remove('ps-piano__key--active');
    handlers.noteOff(note);
  };

  piano.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => {
    for (const key of byPointer.values()) release(key);
    byPointer.clear();
    for (const note of byComputer.values()) handlers.noteOff(note);
    byComputer.clear();
  });

  return () => {
    piano.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
}
