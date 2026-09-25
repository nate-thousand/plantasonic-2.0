/**
 * The stage: the ASCII visual engine drawing what it hears. One look per species,
 * bass from the sound engine's own analysis for glyph scale, a spark per played note.
 */
import { createEngine, type EngineHandle } from 'ascii-visual-engine';
import type { AudioFeatures } from 'plantasia-sound-engine/public';
import type { Species } from './engine.ts';

/** Built-in looks, one per species. Unknown ids warn and keep the current look. */
export const LOOKS: Record<Species, string> = {
  seed: 'glyphOrganicBloom',
  flowers: 'glyphDigitalForest',
  mold: 'glyphCorruptedBroadcast',
  bacteria: 'glyphCrtTerminal',
};

export class Visuals {
  private handle: EngineHandle | null = null;
  private readonly observer: ResizeObserver;
  private smoothBass = 0;

  constructor(private readonly host: HTMLElement, private readonly canvas: HTMLCanvasElement) {
    this.observer = new ResizeObserver(() => this.fit());
    this.observer.observe(host);
  }

  start(species: Species, color: string): void {
    const { width, height } = this.size();
    this.handle = createEngine(this.canvas, { preset: LOOKS[species], width, height, autoStart: true });
    this.handle.setColor(color);
  }

  setColor(color: string): void {
    this.handle?.setColor(color);
  }

  setSpecies(species: Species): void {
    void this.handle?.morphTo(LOOKS[species], { duration: 1.2 });
  }

  /** Called once per animation frame with the engine's raw features; smoothing is ours. */
  frame(features: AudioFeatures): void {
    if (!this.handle) return;
    this.smoothBass += (features.bass - this.smoothBass) * (features.bass > this.smoothBass ? 0.5 : 0.08);
    this.handle.setBassGlyphScale(this.smoothBass);
  }

  /** A note lands as a spark at its horizontal position on the keyboard. */
  note(index: number, count: number, velocity: number): void {
    this.handle?.engine.noteOn({ x: (index + 0.5) / count, y: 0.5, intensity: velocity });
  }

  destroy(): void {
    this.observer.disconnect();
    this.handle?.destroy();
    this.handle = null;
  }

  private size(): { width: number; height: number } {
    const r = this.host.getBoundingClientRect();
    return { width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) };
  }

  private fit(): void {
    const { width, height } = this.size();
    this.handle?.resize(width, height);
  }
}
