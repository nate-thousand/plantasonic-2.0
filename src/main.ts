import 'plantasonic-design-system/css/variables.css';
import './styles/main.scss';
import 'bootstrap';
import { Instrument } from './engine.ts';
import { bind, initTheme, render } from './ui.ts';
import { Visuals } from './visuals.ts';

initTheme();

const root = document.querySelector<HTMLElement>('#app')!;
const instrument = new Instrument();
root.innerHTML = render(instrument);

const stage = root.querySelector<HTMLElement>('#pl-stage')!;
const canvas = root.querySelector<HTMLCanvasElement>('#pl-canvas')!;
const visuals = new Visuals(stage, canvas);

bind(root, instrument, visuals);

// Dev hook for verification and the player-test notes; not part of the instrument.
(window as unknown as { __plantasonic: unknown }).__plantasonic = { instrument, visuals };
