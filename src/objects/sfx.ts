import Phaser from 'phaser';

// Tiny synthesized sounds: no audio files, no licences. Tweak here.
const MASTER_VOLUME = 0.25;

export type SfxName = 'till' | 'water' | 'plant' | 'harvest' | 'hit' | 'break' | 'pickup';

interface Noise {
  kind: 'noise';
  filter: BiquadFilterType;
  freq: number;
  ms: number;
  gain: number;
}
interface Tone {
  kind: 'tone';
  wave: OscillatorType;
  from: number; // Hz
  to: number;
  ms: number;
  gain: number;
  delayMs?: number;
}
type Layer = Noise | Tone;

const SOUNDS: Record<SfxName, Layer[]> = {
  till: [{ kind: 'noise', filter: 'lowpass', freq: 700, ms: 90, gain: 0.9 }],
  water: [{ kind: 'noise', filter: 'bandpass', freq: 2600, ms: 180, gain: 0.5 }],
  plant: [{ kind: 'tone', wave: 'sine', from: 520, to: 720, ms: 80, gain: 0.5 }],
  harvest: [
    { kind: 'tone', wave: 'sine', from: 660, to: 660, ms: 70, gain: 0.5 },
    { kind: 'tone', wave: 'sine', from: 880, to: 990, ms: 110, gain: 0.5, delayMs: 70 },
  ],
  hit: [
    { kind: 'noise', filter: 'bandpass', freq: 1800, ms: 50, gain: 0.7 },
    { kind: 'tone', wave: 'square', from: 240, to: 160, ms: 50, gain: 0.15 },
  ],
  break: [{ kind: 'noise', filter: 'lowpass', freq: 1300, ms: 220, gain: 1 }],
  pickup: [{ kind: 'tone', wave: 'square', from: 880, to: 1320, ms: 60, gain: 0.12, delayMs: 60 }],
};

let noiseBuffer: AudioBuffer | null = null;

function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

export function playSfx(scene: Phaser.Scene, name: SfxName): void {
  // HTML5/NoAudio managers have no context: stay silent.
  const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context as AudioContext | undefined;
  if (!ctx || ctx.state !== 'running') return;

  for (const layer of SOUNDS[name]) {
    const start = ctx.currentTime + (layer.kind === 'tone' ? (layer.delayMs ?? 0) / 1000 : 0);
    const end = start + layer.ms / 1000;
    const gain = ctx.createGain();
    // Fast attack, exponential decay: a short pluck instead of a click.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(layer.gain * MASTER_VOLUME, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(ctx.destination);

    if (layer.kind === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = getNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter;
      filter.frequency.value = layer.freq;
      src.connect(filter).connect(gain);
      src.start(start);
      src.stop(end);
    } else {
      const osc = ctx.createOscillator();
      osc.type = layer.wave;
      osc.frequency.setValueAtTime(layer.from, start);
      osc.frequency.exponentialRampToValueAtTime(layer.to, end);
      osc.connect(gain);
      osc.start(start);
      osc.stop(end);
    }
  }
}
