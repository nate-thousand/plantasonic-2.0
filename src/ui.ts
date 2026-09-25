/**
 * Every pixel of the instrument. Markup is design-system classes (editorial layer,
 * instrument components, Bootstrap offcanvas); this file only composes and binds them.
 */
import { CONTROLS, SPECIES, type Instrument, type Species } from './engine.ts';
import { bindKeyboard, KEY_COUNT, renderKeyboard } from './keyboard.ts';
import { deletePatch, listPatches, savePatch } from './patches.ts';
import type { Visuals } from './visuals.ts';

const THEME_KEY = 'plantasonic.theme';
const LABELS_KEY = 'plantasonic.labels';

function logoBadge(size?: 'lg' | 'xl'): string {
  return `<span class="ps-logo-badge${size ? ` ps-logo-badge--${size}` : ''}" aria-hidden="true"><span>Planta</span><span class="ps-logo-badge__amp">&amp;</span><span>Sonic</span></span>`;
}

function circleBtn(label: string, inner: string, attrs = ''): string {
  return `<button type="button" class="btn btn-secondary btn-circle btn-sm" aria-label="${label}" ${attrs}>${inner}</button>`;
}

function slider(id: string, label: string, value: number, vertical = false): string {
  return `
    <div class="pl-control${vertical ? ' pl-control--vertical' : ''}" data-control="${id}">
      <span class="ps-eyebrow ps-eyebrow--inline pl-control__label">${label}</span>
      <div class="ps-slider${vertical ? ' ps-slider--vertical' : ''}" style="--ps-slider-value:${Math.round(value * 100)}" role="slider" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}" tabindex="0">
        <div class="ps-slider__track"><div class="ps-slider__fill"></div><div class="ps-slider__thumb"></div></div>
      </div>
    </div>`;
}

function speciesRow(current: Species): string {
  return SPECIES.map(
    (s) => `<button type="button" class="btn btn-ghost btn-sm${s.id === current ? ' active' : ''}" data-species="${s.id}">${s.name}</button>`,
  ).join('');
}

function patchList(): string {
  const patches = listPatches();
  if (!patches.length) return `<p class="small text-secondary mb-0">No patches yet. The record key saves one.</p>`;
  return patches
    .map(
      (p) => `<div class="d-flex align-items-center gap-2 py-1">
        <a href="#" class="ps-menu__link flex-grow-1 py-0" data-patch="${p.id}">${p.name}</a>
        <span class="ps-eyebrow ps-eyebrow--inline">${p.snapshot.speciesId}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-delete-patch="${p.id}" aria-label="Delete ${p.name}">×</button>
      </div>`,
    )
    .join('');
}

export function render(instrument: Instrument): string {
  const controls = CONTROLS.map((c) => slider(c, c, instrument.getControl(c), true)).join('');
  return `
    <div class="pl-app ps-page" data-labels="${localStorage.getItem(LABELS_KEY) === 'off' ? 'off' : 'on'}">
      <header class="ps-topbar ps-topbar--compact pl-topbar">
        <div class="ps-topbar__inner">
          ${circleBtn('Open menu', '<span class="ps-burger" aria-hidden="true"><i></i><i></i><i></i></span>', 'data-bs-toggle="offcanvas" data-bs-target="#pl-menu"')}
          ${logoBadge()}
          <div class="ps-topbar__right">
            <span class="ps-status" id="pl-status"><span class="ps-status__dot"></span><span id="pl-status-text">Silent</span></span>
          </div>
        </div>
      </header>

      <main class="pl-main">
        <section class="pl-stage" id="pl-stage" aria-label="Stage">
          <canvas class="pl-stage__canvas" id="pl-canvas"></canvas>
        </section>

        <section class="pl-panel">
          <div class="ps-listbar pl-species">
            <div class="ps-listbar__filters" role="group" aria-label="Species" id="pl-species">${speciesRow(instrument.species)}</div>
            <div class="ps-transport ps-transport--bar pl-transport" role="group" aria-label="Transport">
              <button type="button" class="ps-transport-btn" data-transport="record" aria-label="Save patch"><span class="ps-transport-btn__rec"></span></button>
              <button type="button" class="ps-transport-btn" data-transport="play" aria-label="Let it grow"><span class="ps-transport-btn__play"></span></button>
              <button type="button" class="ps-transport-btn" data-transport="stop" aria-label="Played only"><span class="ps-transport-btn__stop"></span></button>
              <div class="ps-transport__readout pl-readout"><span id="pl-readout-species">${instrument.species}</span><span id="pl-readout-mode">played</span></div>
            </div>
          </div>
          <div class="pl-controls" id="pl-controls">${controls}</div>
        </section>

        <section class="pl-play">
          <div class="pl-wheel">${slider('wheel', 'Wheel', 0, true)}</div>
          ${renderKeyboard()}
        </section>
      </main>

      <div class="offcanvas offcanvas-start ps-menu" tabindex="-1" id="pl-menu" aria-labelledby="pl-menu-label">
        <div class="offcanvas-header">
          <span id="pl-menu-label" class="visually-hidden">Menu</span>
          ${circleBtn('Close menu', '<span aria-hidden="true">×</span>', 'data-bs-dismiss="offcanvas"')}
        </div>
        <div class="offcanvas-body">
          <div class="ps-menu__group">
            <div class="ps-menu__heading">Species</div>
            ${SPECIES.map((s) => `<a class="ps-menu__link" href="#" data-species="${s.id}">${s.name} <span class="small text-secondary">${s.blurb}</span></a>`).join('')}
          </div>
          <div class="ps-menu__group">
            <div class="ps-menu__heading">Patches</div>
            <div id="pl-patches">${patchList()}</div>
          </div>
          <div class="ps-menu__group">
            <div class="ps-menu__heading">Input</div>
            <button type="button" class="btn btn-secondary btn-sm me-2" id="pl-midi">Enable MIDI</button>
            <span class="small text-secondary" id="pl-midi-state">Keys, a to ; on the computer, z / x shift octaves</span>
          </div>
          <div class="ps-menu__group">
            <div class="ps-menu__heading">Player test</div>
            <label class="d-flex align-items-center gap-2 small"><input type="checkbox" class="form-check-input mt-0" id="pl-labels" ${localStorage.getItem(LABELS_KEY) === 'off' ? '' : 'checked'} /> Show control labels</label>
          </div>
          <div class="ps-menu__group">
            <div class="ps-menu__heading">Theme</div>
            <select class="form-select form-select-sm w-auto" id="pl-theme" aria-label="Theme">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <hr class="ps-hairline my-4" />
          <p class="small text-secondary mb-0">Plantasonic 2.0 on Plantasia Sound Engine 1.2.1. Growth, bloom, roots, mold and bacteria shape whatever you play; the wheel opens the filter.</p>
        </div>
      </div>

      <div class="pl-gate" id="pl-gate">
        <div class="pl-gate__inner">
          ${logoBadge('xl')}
          <p class="ps-eyebrow mt-4">Touch to start</p>
          <p class="ps-intro text-center">Play the keys. Turn the sliders while it sounds. Switch species.</p>
        </div>
      </div>
    </div>`;
}

/** Pointer drag on a ps-slider track; value 0..1. */
function bindSlider(el: HTMLElement, onChange: (value: number) => void, vertical: boolean): void {
  const track = el.querySelector<HTMLElement>('.ps-slider__track')!;
  let dragging = false;

  const valueAt = (e: PointerEvent): number => {
    const r = track.getBoundingClientRect();
    const t = vertical ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    return Math.min(1, Math.max(0, t));
  };

  const apply = (v: number): void => {
    el.style.setProperty('--ps-slider-value', String(Math.round(v * 100)));
    el.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    onChange(v);
  };

  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    el.setPointerCapture(e.pointerId);
    apply(valueAt(e));
    e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (dragging) apply(valueAt(e));
  });
  const end = (): void => {
    dragging = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', (e) => {
    const current = Number(el.style.getPropertyValue('--ps-slider-value') || 50) / 100;
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') apply(Math.min(1, current + step));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') apply(Math.max(0, current - step));
    else return;
    e.preventDefault();
  });
}

export function bind(root: HTMLElement, instrument: Instrument, visuals: Visuals): void {
  const app = root.querySelector<HTMLElement>('.pl-app')!;
  const gate = root.querySelector<HTMLElement>('#pl-gate')!;
  const statusText = root.querySelector<HTMLElement>('#pl-status-text')!;
  const status = root.querySelector<HTMLElement>('#pl-status')!;
  const readoutSpecies = root.querySelector<HTMLElement>('#pl-readout-species')!;
  const readoutMode = root.querySelector<HTMLElement>('#pl-readout-mode')!;
  const speciesButtons = root.querySelectorAll<HTMLElement>('[data-species]');
  const patches = root.querySelector<HTMLElement>('#pl-patches')!;

  const sage = (): string => getComputedStyle(document.documentElement).getPropertyValue('--ds-color-sage').trim() || '#7db267';

  const sync = (): void => {
    speciesButtons.forEach((b) => b.classList.toggle('active', b.dataset.species === instrument.species));
    readoutSpecies.textContent = instrument.species;
    readoutMode.textContent = instrument.generative ? 'growing' : 'played';
    status.classList.toggle('ps-status--live', instrument.ready);
    statusText.textContent = !instrument.ready ? 'Silent' : instrument.midi ? 'MIDI on' : instrument.generative ? 'Growing' : 'Ready';
    root.querySelectorAll<HTMLElement>('[data-transport]').forEach((b) => {
      const action = b.dataset.transport;
      b.classList.toggle('ps-transport-btn--active', (action === 'play' && instrument.generative) || (action === 'stop' && !instrument.generative));
    });
  };
  instrument.onChange(sync);

  // Start gate: the first touch unlocks audio.
  let booting = false;
  gate.addEventListener('pointerdown', async () => {
    if (booting) return;
    booting = true;
    gate.querySelector('.ps-eyebrow')!.textContent = 'Waking up';
    try {
      await instrument.boot();
      visuals.start(instrument.species, sage());
      gate.classList.add('pl-gate--away');
      setTimeout(() => gate.remove(), 400);
    } catch (error) {
      booting = false;
      gate.querySelector('.ps-eyebrow')!.textContent = 'Audio did not start. Touch again';
      console.error(error);
    }
  });

  // Species switch: buttons and menu links.
  speciesButtons.forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      void instrument.setSpecies(b.dataset.species as Species).then(() => visuals.setSpecies(instrument.species));
    }),
  );

  // Ecology sliders and the wheel.
  root.querySelectorAll<HTMLElement>('.pl-control').forEach((control) => {
    const id = control.dataset.control!;
    const el = control.querySelector<HTMLElement>('.ps-slider')!;
    const vertical = el.classList.contains('ps-slider--vertical');
    bindSlider(el, (v) => (id === 'wheel' ? instrument.wheel(v) : instrument.setControl(id as (typeof CONTROLS)[number], v)), vertical);
  });

  // Keys.
  bindKeyboard(root, {
    noteOn: (note, velocity, index) => {
      instrument.noteOn(note, velocity);
      visuals.note(index, KEY_COUNT, velocity);
    },
    noteOff: (note) => instrument.noteOff(note),
  });

  // Transport: record saves a patch, play lets it grow, stop returns to played mode.
  root.querySelectorAll<HTMLElement>('[data-transport]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!instrument.ready) return;
      const action = b.dataset.transport;
      if (action === 'record') {
        savePatch(instrument.snapshot());
        patches.innerHTML = patchList();
        bindPatches();
        b.classList.add('ps-transport-btn--record');
        setTimeout(() => b.classList.remove('ps-transport-btn--record'), 600);
      } else if (action === 'play') void instrument.setGenerative(true);
      else if (action === 'stop') void instrument.setGenerative(false);
    }),
  );

  function bindPatches(): void {
    patches.querySelectorAll<HTMLElement>('[data-patch]').forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const patch = listPatches().find((p) => p.id === a.dataset.patch);
        if (patch) void instrument.recall(patch.snapshot).then(() => visuals.setSpecies(instrument.species));
      }),
    );
    patches.querySelectorAll<HTMLElement>('[data-delete-patch]').forEach((b) =>
      b.addEventListener('click', () => {
        deletePatch(b.dataset.deletePatch!);
        patches.innerHTML = patchList();
        bindPatches();
      }),
    );
  }
  bindPatches();

  // MIDI.
  const midiButton = root.querySelector<HTMLButtonElement>('#pl-midi')!;
  const midiState = root.querySelector<HTMLElement>('#pl-midi-state')!;
  midiButton.addEventListener('click', async () => {
    const ok = await instrument.enableMidi();
    midiState.textContent = ok ? 'MIDI input on: notes, CC1 wheel, aftertouch, bend' : 'No MIDI input available in this browser';
    midiButton.disabled = ok;
  });

  // Player test: unlabelled pass.
  root.querySelector<HTMLInputElement>('#pl-labels')!.addEventListener('change', (e) => {
    const on = (e.target as HTMLInputElement).checked;
    app.dataset.labels = on ? 'on' : 'off';
    localStorage.setItem(LABELS_KEY, on ? 'on' : 'off');
  });

  // Theme.
  const theme = root.querySelector<HTMLSelectElement>('#pl-theme')!;
  theme.value = document.documentElement.getAttribute('data-theme') ?? 'light';
  theme.addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', theme.value);
    localStorage.setItem(THEME_KEY, theme.value);
    visuals.setColor(sage());
  });

  // Visual sparks for notes the generator plays, and the per-frame feature feed.
  instrument.on('notePlayed', ({ source, velocity }) => {
    if (source !== 'host') visuals.note(Math.random() * KEY_COUNT, KEY_COUNT, velocity);
  });
  const loop = (): void => {
    if (instrument.ready) visuals.frame(instrument.features());
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  sync();
}

export function initTheme(): void {
  const stored = localStorage.getItem(THEME_KEY);
  document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light');
}
