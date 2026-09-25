# Plantasonic 2.0

A played instrument on [Plantasia Sound Engine](https://github.com/nate-thousand/plantasia-sound-engine): seventeen keys, a mod wheel, five ecology sliders and a species switch, on a phone or a laptop. Started from the engine's `docs/INSTRUMENT_BRIEF.md`.

The engine makes the sound. The [ASCII visual engine](https://github.com/nate-thousand/ascii-visual-engine) draws what it hears. The instrument owns every pixel, and every pixel is a [design-system](../plantasonic-design-system) class.

## Run

```bash
npm install
npm run dev      # http://localhost:5177
```

Touch anywhere to start (audio needs a gesture). Keys are on screen and on the computer keyboard (`a` to `;`, black keys on `w e t y u o p`, `z` and `x` shift octaves). The wheel is the vertical slider next to the keys; a hardware mod wheel does the same after **Enable MIDI** in the menu.

- **Species**: Seed, Flowers, Mold, Bacteria. Switching keeps held notes, sliders and the wheel route.
- **Sliders**: growth, bloom, roots, mold, bacteria. Each species reads them its own way.
- **Transport**: the record key saves a patch (an engine snapshot); play lets the species grow on its own; stop returns to played-only.
- **Patches** live in the menu and recall with a one second morph.

## Dependencies

| Package | Pin | Why |
| --- | --- | --- |
| `plantasia-sound-engine` | `github:…#1.2.1` | The brief's pin. Installing from git runs the engine's `prepare` build |
| `ascii-visual-engine` | `github:…#v0.4.1` | Same pattern; `prepare` builds `dist/` |
| `plantasonic-design-system` | `file:../plantasonic-design-system` | Sibling checkout while the instrument components are still being documented; pin a tag (`v1.3.1` or later) for a standalone checkout |

## Rules from the brief

- Engine requests go back as issues on the engine repo, one per request, with the player's need in the first line. The instrument never patches the engine, vendors a copy, or reaches past the public tier for anything but `feedMidi`.
- The instrument does not modify plantasonic-platform, plantasonic-xyz or Signal 9.
- Test on a real phone in Safari early.
- The instrument is accepted by a stranger, not by its author: see [docs/PLAYER_TEST.md](./docs/PLAYER_TEST.md).

## Layout

```
src/
  main.ts       boot and mount
  engine.ts     the sound engine wrapper: boot, keys, controls, wheel, species, generative, snapshots, MIDI
  visuals.ts    the ASCII stage: one look per species, bass to glyph scale, a spark per note
  keyboard.ts   seventeen keys, multi-touch with glide, computer keyboard map
  patches.ts    snapshots in localStorage
  ui.ts         markup (design-system classes) and bindings
  styles/       design-system imports plus the pl-* layout grid
docs/PLAYER_TEST.md   the acceptance protocol and answer sheet
```
