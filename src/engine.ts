/**
 * The sound side of the instrument: one Plantasia engine, the seven playing methods,
 * and the two stories from the brief (the mod wheel route and the species switch).
 *
 * The root export is used for exactly one thing the public tier lacks: `feedMidi`,
 * which lets the on-screen wheel drive the CC1 route without hardware.
 */
import { createPlantasiaEngine } from 'plantasia-sound-engine';
import type {
  AudioFeatures,
  EcologicalControl,
  EngineEventHandler,
  EngineEventName,
  EngineSnapshot,
  SpeciesId,
} from 'plantasia-sound-engine/public';

export const SPECIES = [
  { id: 'seed', name: 'Seed', blurb: 'a single waiting tone that thickens as it grows' },
  { id: 'flowers', name: 'Flowers', blurb: 'bright chords that open with bloom' },
  { id: 'mold', name: 'Mold', blurb: 'decay, tape wear, slow degradation' },
  { id: 'bacteria', name: 'Bacteria', blurb: 'swarms of tiny voices' },
] as const satisfies ReadonlyArray<{ id: SpeciesId; name: string; blurb: string }>;

export const CONTROLS = ['growth', 'bloom', 'roots', 'mold', 'bacteria'] as const satisfies ReadonlyArray<EcologicalControl>;

export type Species = (typeof SPECIES)[number]['id'];

type Listener = () => void;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export class Instrument {
  readonly engine = createPlantasiaEngine();
  species: Species = 'seed';
  generative = false;
  ready = false;
  midi = false;

  private readonly held = new Map<string, number>();
  private readonly changed = new Set<Listener>();

  /** Unlocks audio and runs the graph in played mode. Call from the first touch. */
  async boot(): Promise<void> {
    await this.engine.init();
    await this.engine.loadSpecies(this.species);
    await this.engine.start({ generative: false });
    // The mod wheel: one route, made once, survives everything.
    this.engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', 1);
    this.ready = true;
    this.emit();
  }

  get running(): boolean {
    return this.engine.getState() === 'running';
  }

  onChange(listener: Listener): () => void {
    this.changed.add(listener);
    return () => this.changed.delete(listener);
  }

  private emit(): void {
    for (const l of this.changed) l();
  }

  noteOn(note: string, velocity = 0.8): void {
    if (!this.running) return;
    this.held.set(note, velocity);
    this.engine.noteOn(note, velocity);
  }

  noteOff(note: string): void {
    this.held.delete(note);
    if (this.running) this.engine.noteOff(note);
  }

  allNotesOff(): void {
    this.held.clear();
    this.engine.allNotesOff();
  }

  heldNotes(): string[] {
    return [...this.held.keys()];
  }

  setControl(control: EcologicalControl, value: number): void {
    if (!this.ready) return;
    this.engine.setControl(control, clamp01(value));
  }

  getControl(control: EcologicalControl): number {
    return this.ready ? this.engine.getControl(control) : 0.5;
  }

  /** The on-screen wheel, 0..1, fed as CC1 so the same route serves a hardware wheel. */
  wheel(value: number): void {
    if (!this.ready) return;
    this.engine.feedMidi([0xb0, 1, Math.round(clamp01(value) * 127)]);
  }

  /** loadSpecies stops the running species, so start again and re-trigger what is held. */
  async setSpecies(id: Species): Promise<void> {
    if (!this.ready || id === this.species) return;
    const holding = [...this.held];
    await this.engine.loadSpecies(id);
    await this.engine.start({ generative: this.generative });
    this.species = id;
    for (const [note, velocity] of holding) this.engine.noteOn(note, velocity);
    this.emit();
  }

  /** Generative on is "let it grow"; off is the played instrument. */
  async setGenerative(on: boolean): Promise<void> {
    if (!this.ready || on === this.generative) return;
    const holding = [...this.held];
    this.generative = on;
    this.engine.stop();
    await this.engine.start({ generative: on });
    for (const [note, velocity] of holding) this.engine.noteOn(note, velocity);
    this.emit();
  }

  snapshot(): EngineSnapshot {
    return this.engine.getSnapshot();
  }

  async recall(snapshot: EngineSnapshot, morphSec = 1): Promise<void> {
    if (!this.ready) return;
    await this.engine.applySnapshot(snapshot, { morphSec });
    this.species = snapshot.speciesId as Species;
    this.emit();
  }

  async enableMidi(): Promise<boolean> {
    this.midi = await this.engine.enableMidi();
    this.emit();
    return this.midi;
  }

  features(): AudioFeatures {
    return this.engine.getAudioFeatures();
  }

  tempo(): number {
    return this.ready ? this.engine.getSnapshot().tempo : 0;
  }

  on<E extends EngineEventName>(event: E, handler: EngineEventHandler<E>): () => void {
    return this.engine.on(event, handler);
  }
}
