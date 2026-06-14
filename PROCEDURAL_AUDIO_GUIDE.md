# High-Quality Procedural Sound Synthesis in JavaScript for Web Games — A Technical Guide

## TL;DR

Yes, production-quality procedural audio is fully achievable in the browser today. The Web Audio API's native node graph handles ~80% of the work cheaply, and AudioWorklet (with Rust/Wasm if you want it) handles the sample-level DSP for the rest. The right architecture is hybrid: native nodes for envelopes/filters/spatialization, Worklets for custom synthesis, and layering/randomization on top to defeat repetition. Andy Farnell synthesized a full FPS soundscape (fire, water, wind, rain, animals, footsteps, guns, vehicles) in real time on a 533 MHz CPU back in 2005 — modern hardware has enormous headroom.

Every sound category maps to a known DSP recipe: impacts → modal synthesis (exciter + resonant filter bank, damping = material); footsteps → granular + stochastic layering; weapons → transient + filtered-noise body + sub + convolution tail; engines → pitch-synchronous grains/additive engine orders; wind/fire/water → filtered noise + resonant bandpasses + bubble sinusoids; creatures → source-filter/formant synthesis. The "bible" is Andy Farnell's Designing Sound (MIT Press, 2010), whose Pure Data patches translate almost 1:1 to Web Audio graphs.

Coming from Rust, you have a real edge: compile DSP to Wasm and run it inside an AudioWorkletProcessor for GC-free, near-native, SIMD-accelerated audio. fundsp and dasp are the relevant crates; waw-rs and Casey Primozic's write-ups show the exact bridging pattern. Use Wasm for heavy per-sample work, native nodes for everything else.

## Key Findings

**The render quantum is 128 frames.** Per the W3C Web Audio API spec §2.4: "Rendering an audio graph is done in blocks of 128 samples-frames. A block of 128 samples-frames is called a render quantum, and the render quantum size is 128." process() is called once per block (32-bit floats, range [−1,1]) at the context sample rate (typically 48 kHz). The newer spec adds an optional renderSizeHint, but Chromium's "hardware" hint still returns 128 — and MDN advises always checking the size of the sample array rather than hardcoding 128, since block size may become configurable.

**AudioWorklet replaced ScriptProcessorNode** specifically because ScriptProcessor ran on the main thread with asynchronous event handling, causing latency and glitches. Worklets run synchronously on the dedicated audio rendering thread.

**Modal synthesis is the single most important technique for impacts** and is the deep physical model behind material perception: a struck object's sound is a sum of exponentially-decaying sinusoids, one per vibrational mode, mapping directly to a bank of resonant bandpass (biquad) filters excited by a short impulse.

**Damping (decay rate), not pitch, is the dominant cue for material identification** (Klatzky, Pai & Krotkov, Presence 2000). Metal = many long-ringing inharmonic modes (high Q); wood = few fast-decaying modes (low Q).

**Layering is the universal professional technique:** real gunshots/explosions are built from a transient "crack", a low-frequency "body", noise texture, and a reverberant tail — each synthesized separately and summed.

**Randomization defeats the "machine-gun" repetition** that human ears detect quickly: round-robin selection, per-grain pitch/position jitter, and parameter randomization on every trigger.

**HRTF panning is built in.** PannerNode with panningModel = "HRTF" does binaural convolution with measured head-related impulse responses for true 3D positioning over headphones.

## Details

### 1. Core Web Audio Foundations for Procedural Audio

**The graph and the clock.** Everything hangs off a single AudioContext. Source nodes (OscillatorNode, AudioBufferSourceNode, AudioWorkletNode, ConstantSourceNode) feed processing nodes (GainNode, BiquadFilterNode, WaveShaperNode, ConvolverNode, DelayNode, DynamicsCompressorNode, StereoPannerNode, PannerNode, AnalyserNode) and terminate at ctx.destination. The critical asset for procedural game audio is the sample-accurate audio clock, ctx.currentTime. Never schedule with setTimeout; always schedule against currentTime.

**AudioParam automation** is how you build envelopes without writing DSP:

- `setValueAtTime(v, t)` — hard set; always call first to anchor the start.
- `linearRampToValueAtTime(v, t)` — linear segment (good for attack).
- `exponentialRampToValueAtTime(v, t)` — exponential segment; cannot target or start from 0 (use a tiny value like 1e-4). Natural for decays because perceived loudness is roughly logarithmic.
- `setTargetAtTime(target, startTime, timeConstant)` — exponential approach with a time constant; each timeConstant covers 63.2% of the remaining distance. Ideal for ADSR decay/release. The third argument is a time constant, not an end time — to finish in ~D seconds, use timeConstant ≈ D/3 (reaches ~95%).
- `setValueCurveAtTime(arr, t, dur)` — arbitrary curve from an array.
- `cancelScheduledValues / cancelAndHoldAtTime` — for retriggering.

**A reusable ADSR on any AudioParam:**

```javascript
function applyADSR(param, t0, {a, d, s, r, peak=1, floor=1e-4}) {
  param.cancelScheduledValues(t0);
  param.setValueAtTime(floor, t0);
  param.linearRampToValueAtTime(peak, t0 + a);                          // attack
  param.exponentialRampToValueAtTime(Math.max(s, floor), t0 + a + d);   // decay→sustain
  return (tRelease) => {                                                // release
    param.cancelScheduledValues(tRelease);
    param.setValueAtTime(param.value, tRelease);
    param.exponentialRampToValueAtTime(floor, tRelease + r);
  };
}
```

**Procedurally generated buffers.** For one-shots, compute a Float32Array, drop it in an AudioBuffer, and play through an AudioBufferSourceNode — perfect for pre-rendering an impulse response, a noise burst, or a Karplus–Strong pluck. PeriodicWave (via ctx.createPeriodicWave(real, imag)) defines a custom harmonic spectrum for an oscillator — additive timbres at near-zero per-sample cost because the oscillator is native.

**AudioWorklet — the heart of real procedural synthesis.** Register a processor in a separate module file, then instantiate it on the main thread.

### 2. Fundamental Synthesis Techniques

**Noise generation.** White = Math.random()*2−1. Pink (−3 dB/oct; the most useful for natural textures — wind, ocean, breath) is best done with Paul Kellet's filter or the Voss–McCartney algorithm. Brown/red (−6 dB/oct; deep rumble, thunder) is a leaky integrator.

**Subtractive** = rich source (saw/pulse/noise) → filter (BiquadFilterNode lowpass/bandpass with Q) → VCA (GainNode + ADSR). Native biquad/oscillator nodes make this almost free.

**Additive** = sum of sinusoids. Use PeriodicWave for static harmonic spectra; sum many OscillatorNodes for time-varying partials (expensive past ~20–30 voices — move big banks to a Worklet).

**FM** = a modulator oscillator drives a carrier's frequency. Native: connect a gain-scaled oscillator to the carrier's .frequency AudioParam (gain = modulation index). Great for metallic/bell timbres and high-frequency impact sheen.

**AM / ring modulation** = multiply two signals. Connect a modulator into a GainNode.gain for AM; true ring mod multiplies sample-by-sample in a Worklet.

**Granular synthesis** is the workhorse for realistic textures (footsteps, fire, engines, ambience). Cut a source into short (5–100 ms) windowed grains and re-trigger with randomized position, pitch, density and stereo spread.

**Physical modeling:**
- **Karplus–Strong** (plucked string): a short noise burst injected into a delay line whose length sets the pitch, with a lowpass filter in the feedback loop for natural decay.
- **Modal synthesis** (struck/impact objects): below.
- **Waveguides** (tubes, winds, engine exhaust): bidirectional delay lines; implement in a Worklet.

### 3. Category-Specific Recipes

#### Impacts / Collisions — Modal Synthesis

The deepest, most rewarding recipe. Physics: a struck object vibrates at resonant modes, each an exponentially-decaying sinusoid. The impulse response is:

```
y(t) = Σₙ aₙ · e^(−dₙ·t) · sin(2π·fₙ·t)
```

where each mode is a triple (fₙ, dₙ, aₙ) = (frequency, decay coefficient, amplitude). This is mathematically equivalent to a bank of resonant ("reson") bandpass filters — one biquad per mode — excited by an impulse.

**Decay law:** dₙ = ρ·fₙ — decay rate is proportional to frequency, and ρ is a material-only constant. Small ρ → undamped/metallic; large ρ → heavily damped (wood/plastic). High-frequency modes always die first, which is why a struck metal bar loses brightness as it rings out.

**Frequency ratios come from shape:**
- Ideal string: harmonic ratios 1:2:3:4…
- Free–free bar (metal-bar/glockenspiel signature): inharmonic ratios 1.0 : 2.76 : 5.40 : 8.90

**Material Q/decay guidance:** metal/steel = many modes, high Q (~100–1000+), rings for seconds; glass = high Q but fewer modes, brittle, decay hundreds of ms to seconds; ceramic/stone = moderate-high Q, short-medium ring; wood = few modes, low Q (~10–50), decay tens of ms; rubber/plastic = very low Q, decay <100 ms.

#### Footsteps — Granular + Stochastic Layering

A footstep is a brief, noisy, multi-component contact event dominated by surface material. Recipe:
- **Crunchy/granular surfaces** (gravel, snow, leaves): trigger a cloud of short grains (sharp noise transients band-passed at randomized resonant frequencies)
- **Hard surfaces** (wood, concrete): a short modal/impact component (resonant click) layered with a faint scuff (filtered noise)
- **Layering:** low "body" thump (heel) + mid "contact" transient + high "texture" (sole/material)
- **Randomization is mandatory:** randomize grain positions, pitch, amplitude, and timing per step

#### Weapons & Explosions — Transient + Body + Texture + Tail

- **Transient / "crack"** — a few-ms sharp high-frequency burst: filtered white-noise spike, near-instant attack, fast decay
- **Body / "punch"** — low-frequency weight (~30–600 Hz): an enveloped sub sine or low-pass-filtered noise with a fast downward pitch sweep
- **Texture** — mid-band filtered noise shaped by a decay envelope for the "roar"/combustion
- **Tail** — a reverberant/convolution tail implies space and scale; longer, lower tails = bigger explosion

#### Engines / Vehicles — Pitch-Synchronous Grains or Engine Orders

- **Granular / pitch-synchronous** (most practical): analyze a single engine firing cycle as a grain, then re-trigger grains at a rate proportional to RPM
- **Additive / "engine orders":** the spectrum is sinusoids at integer and half-integer multiples of crankshaft frequency

#### Wind — Filtered Noise + Resonant Bandpasses

Base: pink/white noise → lowpass for the broad "rush", amplitude modulated by a slow smoothed-random LFO (1/f-like gusting). For howling/whistling, add several narrow bandpass filters (high Q) whose center frequencies are slowly, randomly modulated.

#### Water — Bubble Sinusoids + Streams + Rain

The acoustic primitive of water is the bubble: a single bubble emits a decaying sinusoid whose frequency rises as it shrinks/collapses. Build streams/rivers/rain as a stochastic cloud of bubbles with distributions over radius (→ frequency), rate, and rising factor.

#### Fire — Layered Filtered Noise (the classic three-layer model)

The textbook recipe — three layers summed:
- **Hissing** — high-pass-filtered white noise (>1 kHz), amplitude-modulated by a smoothed random source
- **Crackle** — random impulses, each firing a very short (~20–30 ms) enveloped noise grain through a bandpass at a randomized resonant frequency (~100–1000 Hz)
- **Lapping/body** — low-frequency band-passed noise (~30 Hz), saturated/clipped, for the rolling rumble

Mix roughly crackle:hiss:lapping ≈ 0.1:0.3:0.6 and scatter crackles across the stereo field.

#### Creature Vocalizations — Source-Filter / Formant Synthesis

Model the voice as source × filter (Fant's source-filter model): a glottal source (pulse train for voiced sounds, noise for unvoiced/breath) through a vocal-tract filter = a bank of resonant bandpass filters at formant frequencies.

### 4. Advanced & Realism Techniques

**Convolution reverb.** ConvolverNode convolves your signal with an impulse response. Sources of IRs:
- Real spaces: measured IRs (exponential sine-sweep deconvolution)
- Procedurally generated IRs: exponentially-decaying noise makes a surprisingly good reverb

**Layering** (the #1 realism multiplier): one convincing sound = several synthesis layers (transient + body + texture + tail), each EQ'd to its band, onset-aligned, bus-compressed.

**Randomization / anti-repetition:** round-robin variants, per-trigger parameter randomization (pitch, level, filter, grain position), stochastic event timing.

**Velocity/intensity mapping:** wire physics → synthesis. Collision impulse → modal gain, brightness cutoff, exciter duration; vehicle speed → grain rate; wind speed → noise amplitude.

**Spatialization.** PannerNode positions a source in 3D relative to ctx.listener. Set panningModel="HRTF" for binaural rendering — the right choice for first-person/VR over headphones; equalpower is the cheap default.

**Dynamic mixing & voice management:**
- Voice pooling & polyphony limits: cap simultaneous voices, reuse node graphs, steal the oldest/quietest voice over budget
- Native nodes are cheap; Worklets cost more
- Pre-render static one-shots to AudioBuffers
- Resume the context inside a user gesture (autoplay policy)

### 5. WebAssembly / Rust Relevance

The pattern for performance-critical DSP:
1. Write DSP in Rust, compile to wasm32-unknown-unknown
2. Instantiate the Wasm module inside the AudioWorkletProcessor
3. The JS processor's process() calls into Wasm to fill the 128-sample buffers

**Why:** Rust+Wasm gives reliably high, GC-free performance — critical because a single missed audio frame is an audible click. Rust's Wasm SIMD intrinsics accelerate the buffer operations that dominate DSP.

**Bridging crates:** waw-rs (Marcel-G) provides a Processor trait with process(&mut self, inputs, outputs, sample_rate, params) and a register! macro that wires up the AudioWorkletNode. fundsp (Sami Perttu) offers high-level audio DSP with inline graph notation and a large combinator library.

### 6. Libraries, Tools, Frameworks

- **Tone.js** — the synthesis/sequencing framework: oscillators, synths, effects chains, sample-accurate Transport clock
- **Howler.js** — playback only (files, sprites, cross-browser fallback, basic spatial). Not a synthesis tool
- **Procedural-audio-specific:** Nemisindo (Queen Mary Intelligent Sound Engineering) — pure procedural sound-effect models; GameSynth (Tsugi) — procedural sound-design tool
- **Ambisonic spatial audio:** Omnitone / Mach1

### 7. Key References & Learning

- **Andy Farnell, Designing Sound** (MIT Press, 2010) — the procedural audio text; its Pure Data patches translate almost directly to Web Audio node graphs
- **GDC talks:** Nicolas Fournel "Procedural Audio for Video Games: Are We There Yet?"; "Granular Synthesis in Next-Generation Games"
- **Academic:** van den Doel & Pai (modal synthesis, liquid sounds); Julius O. Smith's online CCRMA books (formants, waveguides, modal theory); Stanford "Improved Water Sound Synthesis using Coupled Bubbles"
- **MDN Web Audio API docs** — authoritative for AudioWorklet, AudioParam automation, PannerNode, and Best Practices

## Recommendations

**Stage 1 — Foundation** Build a small engine around one AudioContext: submix buses (SFX/music/UI), a master DynamicsCompressorNode, a voice pool with a polyphony cap, and a scheduler driven by ctx.currentTime.

**Stage 2 — Native-node recipes** (80% of value, 20% of effort). Implement in pure native nodes: modal impacts (8–16 biquad bandpasses + material presets), fire, wind, footsteps with randomization.

**Stage 3 — Worklet/Wasm for the hot path.** Move anything that strains native nodes or needs per-sample logic into an AudioWorklet or Wasm module.

**Stage 4 — Spatialization & dynamic mix.** Add PannerNode HRTF for 3D sources, distance models, and ducking.

## Caveats

- 128-sample render quantum is the spec default; design DSP around 128
- exponentialRampToValueAtTime can't touch 0 — always ramp to a small epsilon (1e-4)
- setTargetAtTime's third arg is a time constant, not a duration — use ~duration/3
- Browser inconsistencies: native DelayNode-based Karplus–Strong is fragile; AudioWorklet support varies; wasm-bindgen's TextEncoder/TextDecoder assumption breaks in the worklet scope
- Procedural ≠ automatically realistic. Realism comes from modeling the process/physics plus heavy layering, good randomization, and convolution for space
- Material perception is multi-cue: damping is the dominant signal but not sufficient alone; you also need correct mode frequencies and density
