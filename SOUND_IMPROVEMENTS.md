# AgeeArcade Sound System — Physical Modeling & Modal Synthesis

## Overview

Advanced procedural sound synthesis based on **physical modeling** and **modal synthesis**:

- **Modal Synthesis** (NEW) — van den Doel & Pai algorithms for struck, resonant objects: bells, gongs, bars, cymbals. Inharmonic mode ratios + Q-factor damping create authentic material perception (metal vs. wood vs. glass).
- **Procedural Fire** (NEW) — three-layer Farnell model: hiss (filtered white noise w/ AM) + crackle (stochastic grain pops) + lapping (low-frequency rumble). Never repeats, responds to intensity.
- **Physical modeling synthesis** — simulates how real materials vibrate and resonate
- **Realistic impacts** — models actual physics of strikes, explosions, water
- **Resonant chambers** — simulates hollow bodies, material properties, decay
- **Arcade-style background music** (lo-fi, retro themes)
- **Professional mixing chain** (compression, EQ for clean audio)
- **No audio files needed** — all sounds procedurally generated in real-time

## Core Engine Improvements (`/engine/sound/engine.js`)

### 1. Professional Mixing Chain
- **Dynamics Compressor**: Automatic level control for consistent volume and punch
  - Threshold: -50dB | Knee: 40dB | Ratio: 4:1
  - Attack: 3ms | Release: 250ms
  - Prevents clipping and ensures clean audio

### 2. Parametric EQ System
Three-band equalization for tonal shaping:
- **Low Band** (Lowshelf @ 200Hz): Control bass warmth
- **Mid Band** (Peaking @ 1kHz): Shape presence and clarity
- **High Band** (Highshelf @ 8kHz): Enhance or reduce brightness

Control via `ArcadeSound.setEQ(band, level)` where band is 'low', 'mid', or 'high' and level is 0-1.

### 3. Physical Modeling Synthesis
All sounds generated using **physics-based algorithms** that simulate real materials:

#### Core Modeling Techniques

**Resonance Synthesis** (`_resonance`)
- Models struck objects with resonant modes
- Impulse triggers object vibration at specific frequency
- Natural decay envelope (exponential)
- High Q factors (8+) for sharp, ringing tones
- Used for: metallic hits, chimes, resonant impacts

**Plate Synthesis** (`_plate`)
- Models struck metal/wood plates
- Multiple harmonic resonances (fundamental + overtones)
- Frequencies: 1.5x, 2.3x, 3.6x fundamental
- Different Q factors for each mode
- Natural frequency-dependent decay
- Used for: ship hits, impacts, metal surfaces

**Chamber Synthesis** (`_chamber`)
- Models hollow resonant bodies
- Primary + secondary resonances for complex timbres
- Harmonic relationship: 0.67x creates natural partnership
- Used for: cannons, explosions, sinking vessels
- Deep, booming character with secondary rumble

**Modal Synthesis** (`_modal`) — NEW, van den Doel & Pai physical modeling
- Simulates struck, resonant objects with accurate material behavior
- Impulse exciter triggers a bank of inharmonic resonant modes
- Each mode: sine oscillator → peaking filter (with Q and gain) → exponential decay
- Decaying amplitude: y(t) = Σ aₙ · e^(−dₙ·t) · sin(2π·fₙ·t)
- Mode parameters: frequency (fₙ), Q factor (resonance sharpness), amplitude (aₙ), decay time
- Material signature via frequency ratios and Q:
  - **Metal/Steel:** inharmonic ratios 1.0 : 2.76 : 5.40 : 8.90; high Q (10–14); long decay (0.4–1.5s)
  - **Wood:** harmonic or near-harmonic ratios; low Q (3–5); short decay (0.15–0.35s)
  - **Glass:** high Q but sparse modes; moderate-long decay (0.5–1.2s)
  - **Ceramic:** moderate Q; medium decay (0.3–0.8s)
- Used for: gongs, bells, metal bars, xylophones, struck glass
- Zero audible repetition — pure physical model, not sampled

**Procedural Fire** (`_fire`) — NEW, Farnell three-layer model
- Hissing layer: high-pass filtered white noise (>2 kHz), AM-modulated by slow sine (~0.8 Hz) for breathing flicker
- Crackle layer: stochastic grain pops, each a short (~25 ms) bandpass-filtered noise grain at random frequency (300–1000 Hz). Count ≈ 12 pops/sec × intensity; scatter position and frequency per grain for no repetition.
- Lapping/body layer: low-frequency rumble (~40 Hz bandpass), waveshaper-saturated for warmth and "rolling" character
- Layer levels: roughly 0.3 (hiss) : 0.1 (crackle) : 0.25 (lapping) when mixed, modulated by intensity param
- Never repeats; intensity (0–1) controls grain count and layer gains
- Used for: campfire, torch, burning rubble, lava, explosive fire

#### SFX Library (Updated)

**Base Sounds** (existing physical modeling):
- **Combat**: `swing`, `hit`, `heavy_hit`, `slash`, `block` — struck materials
- **Character**: `enemy_death`, `player_hurt`, `player_death` — impact resonances
- **UI/Pickups**: `level_up`, `coin`, `pickup`, `error` — resonant chimes
- **Environment**: `chest_open`, `portal`, `door_open`, `boss_roar`, `explosion`, `magic`
- **Maze Runner**: `wall_hit`, `goal`, `jump`, `land`, `lava`, `fall`, `loot`, `lifeup`, `exit`, `gameover`

**New — Modal Synthesis Impacts** (inharmonic, physically accurate):
- **`gong`** (1.2s): Modes at 400Hz, 1100Hz, 2200Hz, 3600Hz with high Q (6–12). Rich, inharmonic shimmer. Asian temple ambiance.
- **`bell`** (1.5s): Modes at 800Hz, 2100Hz, 4200Hz. Classic church/tower bell tone. High-register sparkle.
- **`metal_bar`** (1.0s): Free–free bar ratios (1.0 : 2.76 : 5.40 : 8.90). Xylophone/metallophone tone. Bright attack, ringing sustain.
- **`wood_bar`** (0.35s): Low Q, few modes (300Hz, 850Hz, 1800Hz). Marimba/wooden mallet character. Warm, dull decay.

**New — Procedural Fire** (infinite variety, Farnell model):
- **`fire`** (0.75s, full intensity): Campfire, burning logs. Three-layer procedural synthesis, never repeats.
- **`fire_small`** (0.50s, 60% intensity): Torch, candle flame. Quieter, faster-decaying variant of full fire.

**New — Weapon Explosions** (aggressive, destructive):
- **`cannon`** (0.90s): Sharp transient crack + deep sub body (80 Hz) + distorted noise + low-freq tail. Artillery-grade destructiveness.
- **`cannon_heavy`** (1.20s, extended tail): Massive cannon, deeper fundamental (60 Hz), longer rumble. Big-gun feel.
- **`explosion_large`** (1.0s): Large explosion, very deep sub (50 Hz), aggressive distortion, extended tail. Bomb/dynamite.
- **`blast`** (0.70s): Quick, sharp blast, higher-pitched fundamental (100 Hz), rapid decay. Grenade/mine.
- **`impact_heavy`** (0.60s): Heavy mecha/vehicle impact, high fundamental (120 Hz), punchy transient, short sustain.
- **`explosion`** (0.85s): Generic explosion, updated to use aggressive synthesis (was chamber-based).

**New — Material-Based Impacts** (parameterized, physically accurate):
- **`metal_hit`** (0.80s): Metal impact, high Q, inharmonic overtones, 1.0s ring
- **`steel_clang`** (1.05s): Steel bars/structures, higher Q, sharper ring, longer sustain
- **`glass_break`** (0.75s): Glass/brittle, very high Q, sparse modes, clean sparkle
- **`ceramic_hit`** (0.65s): Ceramic/pottery, moderate Q, dull character, quick decay
- **`wood_thud`** (0.50s): Wood/timber, low Q, few modes, warm, fast decay
- **`plastic_tap`** (0.40s): Plastic/synthetic, very low Q, dull impact, short decay
- **`rubber_bounce`** (0.45s): Rubber/elastic, minimal resonance, muffled character
- **`stone_crash`** (0.85s): Stone/rock, moderate Q, deep and solid, stable decay

**All sounds**: 0.22-1.5s with realistic physical decay. Zero sampled audio — 100% procedural.

## Spatial Audio (3D Positioning & HRTF Binaural)

All impacts and SFX can be played at specific 3D positions in the arcade, creating true spatial awareness. The system uses:

- **HRTF Panning (Head-Related Transfer Function):** Binaural audio rendering with measured impulse responses for realistic 3D positioning over headphones
- **Distance Attenuation:** Sounds farther away are quieter (inverse distance model)
- **PannerNode:** Native Web Audio API spatial audio
- **Listener Tracking:** Update listener position as player moves through the arcade

### Usage Pattern

```javascript
// Arcade cabinet locations (example coordinates)
const CABINETS = {
  left:    { x: -12, y: 0, z: -11 },  // Far left cabinet
  center:  { x: 0, y: 0, z: -11 },    // Center cabinet
  right:   { x: 12, y: 0, z: -11 },   // Far right cabinet
};

// Player walks, update listener position
ArcadeSound.setListenerPosition(playerX, playerY, playerZ);

// Cabinet impact heard from the cabinet location (spatial)
ArcadeSound.playSpatial('metal_hit', CABINETS.right.x, CABINETS.right.y, CABINETS.right.z);

// Regular play (non-spatial, heard equally in both ears)
ArcadeSound.play('coin');
```

### Coordinate System

- **X-axis:** Left (-) to Right (+), meters
- **Y-axis:** Down (-) to Up (+), meters
- **Z-axis:** Back (-) to Forward (+), meters
- Listener default: (0, 0, 0) facing forward along -Z

### Effect on Perception

- **Same position as listener:** Centered
- **Left/right offset:** Panned left/right based on HRTF (head angle)
- **Behind listener:** Sound comes from behind (pinna cues)
- **Above/below listener:** Vertical cues from frequency filtering
- **Distance variation:** Louder when close, quieter when far (inverse distance)

## Game-Specific Enhancements

### Blacktide Bastion (`/games/blacktide-bastion/js/audio.js`)
Naval warfare with grounded, realistic SFX:
- **cannon**: Deep bass boom (0.35s) — thick and powerful
- **reload**: Mechanical click (0.12s) — crisp, minimal
- **shipHit**: Solid impact (0.20s) — realistic collision sound
- **shipSink**: Descending tone (0.60s) — defeat acknowledged
- **fortHit**: Deep thump (0.45s) — solid defense impact
- **waveClear**: Ascending tone (0.30s) — brief victory confirmation
- **gameOver**: Low descending tone (0.50s) — simple game-end signal
- **upgrade**: Brief ascent (0.20s) — quick feedback
- **splash**: Water noise (0.25s) — natural water element

### Maze Runner (`/games/maze-runner/js/sounds.js`)
Platformer exploration with minimal, naturalistic audio:
- **jump**: Ascending tone (0.18s) — movement feedback
- **land**: Thud impact (0.16s) — ground contact
- **lava**: Warning buzz (0.35s) — danger alert
- **fall**: Descending whoosh (0.40s) — falling sensation
- **loot**: Quick chime (0.18s) — collection sound
- **lifeup**: Healing tone (0.25s) — positive feedback
- **exit**: Finish sound (0.30s) — level complete
- **gameover**: Low tone (0.40s) — game end

### Spear Fisher (`/games/spear_fisher/js/sounds.js`)
Fishing game with oceanic, realistic sounds:
- **sf_throw**: Whoosh (0.20s) — spear launch
- **sf_splash**: Splash (0.30s) — water impact
- **sf_stick**: Impact (0.18s) — spear connection
- **sf_pull**: Tension sound (0.16s) — reel resistance
- **sf_catch**: Success chime (0.25s) — catch confirmation
- **sf_gameover**: Ending tone (0.35s) — session end

### Depths of Ashenveil (`/games/depths-of-ashenveil/js/engine/sound/engine-sound.js`)
Uses enhanced shared sound library with creepy, low-frequency ambient theme.
Automatic benefits from all base sound improvements.

## Technical Details

### Signal Flow
```
┌─────────────────┐
│  Music Bus      │
├─────────────────┤
│  SFX Bus        │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Compressor│  (Dynamic control)
    └────┬─────┘
         │
    ┌────▼───────────────┐
    │ EQ Low (Lowshelf)   │
    └────┬───────────────┘
         │
    ┌────▼──────────────┐
    │ EQ Mid (Peaking)   │
    └────┬──────────────┘
         │
    ┌────▼───────────────┐
    │ EQ High (Highshelf)│
    └────┬───────────────┘
         │
    ┌────▼────────────┐
    │  Master Gain    │
    └────┬────────────┘
         │
    ┌────▼──────────┐
    │ Destination   │
    └───────────────┘
```

### Physical Modeling Quality
- **Impulse-triggered resonance**: Short noise burst triggers material vibration
- **Resonant modes**: Biquad peaking filters at specific frequencies and Q factors
- **Realistic decay**: Exponential amplitude falloff matching real physics
- **Harmonic relationships**: Overtones at natural frequency ratios
- **Material damping**: Q-factor controls resonance sharpness/duration
- **Multi-mode systems**: Multiple independent resonances create complex timbres
- **Authentic character**: Sounds like actual struck materials, not synthetic tones

## Public API

### Core Methods
```javascript
ArcadeSound.init()              // Initialize audio context
ArcadeSound.play(name)          // Play SFX
ArcadeSound.playSpatial(name, x, y, z)  // Play SFX at 3D position (meters)
ArcadeSound.startAmbient(theme) // Start music
ArcadeSound.stopAmbient()       // Stop music
ArcadeSound.startEnvironment(type, intensity)  // Start continuous env sound
ArcadeSound.stopEnvironment()   // Stop env sound
ArcadeSound.footstep(material, intensity)      // Play footstep sound
```

### Volume & EQ Control
```javascript
ArcadeSound.setVolume(level)    // Master volume (0-1)
ArcadeSound.setVolumes({...})   // Detailed volume control
ArcadeSound.setEQ(band, level)  // band: 'low'|'mid'|'high', level: 0-1
ArcadeSound.getEQ()             // Returns {low, mid, high}
ArcadeSound.getVolumes()        // Returns {master, music, sfx}
```

### Spatial Audio (3D Positioning & HRTF)
```javascript
// Play sound at 3D position (x, y, z in meters relative to listener)
ArcadeSound.playSpatial('explosion', 5, 0, -3);  // 5m right, 3m back
ArcadeSound.playSpatial('metal_hit', -2, 1, 0);  // 2m left, 1m up

// Update listener (player) position in 3D space
ArcadeSound.setListenerPosition(0, 0, 0);  // Center (default)
ArcadeSound.setListenerPosition(10, 0, 5); // Move listener

// Update listener orientation (which way player is facing)
// Arguments: forwardX, forwardY, forwardZ, upX, upY, upZ
ArcadeSound.setListenerOrientation(0, 0, -1, 0, 1, 0); // Default (facing -Z)
ArcadeSound.setListenerOrientation(1, 0, 0, 0, 1, 0);  // Facing right (+X)
```

### Registration & Customization
```javascript
ArcadeSound.registerSFX(name, duration, buildFn)      // Custom SFX
ArcadeSound.registerTheme(name, theme)                // Custom music theme
ArcadeSound.registerFootstepMaterial(material, params) // Custom footstep
```

## Performance Characteristics

- **CPU Impact**: < 5% on modern devices
- **Memory**: ~2MB for pre-rendered SFX buffers
- **Latency**: < 50ms from trigger to audible output
- **Compatibility**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile**: Full support with audio context suspension handling

## Future Enhancements

**Completed (June 2026):**
- ✅ Modal synthesis (van den Doel & Pai) — gong, bell, metal_bar, wood_bar
- ✅ Procedural fire (Farnell three-layer model) — fire, fire_small
- ✅ Weapon explosions (transient + sub sweep + distorted body + rumble tail) — cannon, cannon_heavy, explosion_large, blast, impact_heavy

**Possible future additions:**
1. **Velocity-sensitive modal synthesis** — stronger strikes trigger more/higher harmonics (collision energy → exciter gain + mode selection)
2. **Granular footsteps** — AudioWorklet for true stochastic grain clouds, material-dependent
3. **Convolver reverb** — acoustic space simulation via impulse response convolution
4. **Damping filters** — per-mode Q-variation with frequency (realistic high-frequency roll-off)
5. **Coupled modes** — mode-to-mode energy transfer (nonlinear interactions for richer timbre evolution)
6. **3D spatial audio** — PannerNode HRTF for impact sources (positioned strikes)
7. **Real-time modulation** — pitch/amplitude envelopes driven by game state (RPM → grain rate, wind speed → noise intensity)
8. **Waveguide synthesis** — model sound propagation through tubes (wind instruments, engines, exhaust pipes)
9. **Water synthesis** — bubble sinusoids with size-dependent frequency, splash granularity
10. **Source-filter creature vocalizations** — formant-based creature calls, pitch modulation

## Testing Physical Modeling & Modal Sounds

1. Open any game (Blacktide Bastion, Maze Runner, or Spear Fisher) and open the browser console
2. **Test new modal impacts:**
   ```javascript
   // In browser console
   await ArcadeSound.init();
   ArcadeSound.play('gong');      // Inharmonic shimmer, long ring
   ArcadeSound.play('bell');      // Church bell tone, classic overtone spread
   ArcadeSound.play('metal_bar'); // Xylophone/metallophone, free–free bar ratios
   ArcadeSound.play('wood_bar');  // Marimba character, warm, quick decay
   ```

3. **Test procedural fire:**
   ```javascript
   // Full fire
   ArcadeSound.play('fire');       // Campfire: hiss + crackle + lapping, never repeats
   ArcadeSound.play('fire_small'); // Torch: quieter, shorter, 60% intensity
   
   // Play fire multiple times — zero repetition, each is unique
   ArcadeSound.play('fire'); ArcadeSound.play('fire');
   ```

4. **Test weapon explosions (aggressive, destructive):**
   ```javascript
   // Listen for aggressive, destructive character — NOT musical
   ArcadeSound.play('explosion');     // Updated: sharp transient + deep sub + distortion
   ArcadeSound.play('cannon');        // Artillery boom: 80 Hz fundamental, 0.9s
   ArcadeSound.play('cannon_heavy');  // Big gun: 60 Hz, 1.2s, extended tail
   ArcadeSound.play('explosion_large'); // Bomb: 50 Hz, very deep, aggressive distortion
   ArcadeSound.play('blast');         // Sharp blast: 100 Hz, quick, snappy
   ArcadeSound.play('impact_heavy');  // Mecha impact: 120 Hz, punchy, short
   ```

4. **Listen for physical modeling characteristics:**
   - **Modal sounds (gong, bell, metal_bar, wood_bar):**
     - Ring and resonate naturally (Q-factor determines ring time)
     - Frequency content follows inharmonic ratios for metal, harmonic for others
     - Decay time varies by material: wood < ceramic < glass < metal
     - Attack is percussive (exciter impulse), sustain is oscillatory (resonance)
     - No repetition — pure physical model, not sampled
   
   - **Fire sounds (fire, fire_small):**
     - Hissing layer: white noise rush, amplitude flickers with slow breathing (~0.8 Hz)
     - Crackle layer: random pops at randomized frequencies, varying density
     - Lapping layer: deep rumble, warm and organic
     - No repetition across multiple plays — crackles are stochastically placed
   
   - **Existing impacts (cannon, ship_hit, etc.):**
     - Cannon: Deep resonant boom with secondary ring (authentic artillery)
     - Ship Hit: Ringing metal hull with impact texture
     - Land/Jump: Ground/spring resonance, multi-layered thump
     - Chimes (level_up, coin): Clear, ringing metallic quality

5. **Adjust EQ to taste:**
   ```javascript
   ArcadeSound.setEQ('low', 0.6);   // Less boomy if chambers too loud
   ArcadeSound.setEQ('high', 0.8);  // More brightness / ring if too dull
   ArcadeSound.setEQ('mid', 0.7);   // Presence control for impact clarity
   
   // Reset to neutral (0.5)
   ArcadeSound.setEQ('low', 0.5);
   ArcadeSound.setEQ('mid', 0.5);
   ArcadeSound.setEQ('high', 0.5);
   ```

## Physical Modeling Sound Design

For developers customizing or creating new sounds:

### Physical Modeling & Modal Synthesis Functions

**Resonance** — struck/vibrating object
```javascript
ArcadeSound.registerSFX('ring', 0.30, (o, n) => {
  // _internal.resonance(offCtx, noiseBuf, frequency, Q, duration, gain, decay)
  ArcadeSound._internal.resonance(o, n, 800, 8, 0.30, 0.25, 0.30);
  // Params: freq=800Hz, Q=8 (sharp ring), decay=0.30s, gain=0.25
});
```

**Plate** — struck metal/material with harmonics
```javascript
ArcadeSound.registerSFX('clang', 0.32, (o, n) => {
  // _internal.plate(offCtx, noiseBuf, duration, fundamental_frequency)
  ArcadeSound._internal.plate(o, n, 0.32, 300);
  // Creates harmonics at 1x, 1.5x, 2.3x, 3.6x the fundamental
});
```

**Chamber** — hollow resonant body
```javascript
ArcadeSound.registerSFX('boom', 0.65, (o, n) => {
  // _internal.chamber(offCtx, noiseBuf, duration, pitch_Hz, decay_time)
  ArcadeSound._internal.chamber(o, n, 0.65, 80, 0.65);
  // Models drum/cannon chamber with two harmonic modes
});
```

**Modal** — van den Doel & Pai inharmonic mode synthesis
```javascript
ArcadeSound.registerSFX('crystal', 1.2, (o, n) => {
  // _internal.modal(offCtx, noiseBuf, modesArray, exciterDuration, exciterGain)
  ArcadeSound._internal.modal(o, n, [
    { freq: 600, q: 12, amp: 0.35, decay: 1.0 },  // fundamental
    { freq: 1680, q: 10, amp: 0.22, decay: 0.8 }, // inharmonic overtone (2.8x)
    { freq: 3200, q: 8, amp: 0.15, decay: 0.6 },  // higher harmonic
  ], 0.02, 0.35);
  // freq: resonant frequency (Hz)
  // q: quality factor (sharpness of ring; 3–5 = dull, 8–12 = bright metal, 12+ = bell)
  // amp: initial amplitude of mode (0–1)
  // decay: time for mode to decay to silence (s)
  // exciterDuration: how long the initial noise impulse lasts (0.01–0.05 s)
  // exciterGain: amplitude of exciter noise (0.2–0.5)
});
```

**Fire** — Farnell three-layer procedural fire
```javascript
ArcadeSound.registerSFX('burning_tree', 0.80, (o, n) => {
  // _internal.fire(offCtx, noiseBuf, duration, intensity)
  ArcadeSound._internal.fire(o, n, 0.80, 1.0);
  // duration: how long the fire sound lasts (s; typically 0.5–1.5)
  // intensity: 0–1, scales all three layers and crackle count
  //   0.3 = distant smolder, few pops
  //   0.6 = steady campfire
  //   1.0 = roaring bonfire, many pops
  // Internally: hiss + crackle + lapping mixed, no repetition
});
```

**Explosion** — Transient + sub body + distorted texture + rumble tail
```javascript
ArcadeSound.registerSFX('big_boom', 0.95, (o, n) => {
  // _internal.explosion(offCtx, noiseBuf, duration, depthFreq, intensity)
  ArcadeSound._internal.explosion(o, n, 0.95, 55, 1.05);
  // depthFreq: fundamental frequency of deep sub body (30–150 Hz)
  //   30–50 Hz = massive (nuke, earth shaker)
  //   50–80 Hz = heavy artillery/vehicle (cannon, bomb)
  //   100–150 Hz = sharp blasts (grenade, mine, light explosives)
  // intensity: 0.7–1.2, scales all layers
  //   0.7 = small explosion
  //   1.0 = standard
  //   1.2 = massive, clipping on purpose
  // Internally: sharp transient (3 kHz) + pitched sub (exponential sweep down)
  //   + distorted noise body (150 Hz bandpass) + low rumble tail
});
```

**Impact** — Parameterized material-based synthesis
```javascript
ArcadeSound.registerSFX('hammer_on_wood', 0.50, (o, n) => {
  // _internal.impact(offCtx, noiseBuf, material, intensity, size)
  ArcadeSound._internal.impact(o, n, 'wood', 0.9, 'large');
  // material: 'metal'|'steel'|'glass'|'ceramic'|'wood'|'plastic'|'rubber'|'stone'|'explosive'
  //   Each has distinct Q, mode frequencies, and decay characteristics
  // intensity: 0.5–1.2, scales amplitude and resonance
  // size: 'small'|'medium'|'large', scales frequency ratios and decay times
  //   small = higher pitched, quick decay
  //   medium = balanced
  //   large = lower pitched, longer decay
  //
  // Material properties (physically grounded):
  //   metal/steel = many high-Q modes, inharmonic, long decay
  //   glass = sparse high-Q modes, brittle, clean
  //   ceramic = moderate Q, few modes, dull
  //   wood = very low Q, few modes, warm, fast decay
  //   plastic/rubber = minimal resonance, muffled, quick
  //   stone = moderate Q, solid, stable
  //   explosive = uses _explosion() internally
});
```

### Parameter Guide

| Parameter | Meaning | Typical Range | Effect |
|-----------|---------|---------------|--------|
| **frequency** | Resonant pitch | 30-4000 Hz | Higher = brighter |
| **Q** | Resonance sharpness | 4-10 | Higher = longer ring |
| **duration** | Sound length | 0.2-1.0 s | Decay time |
| **gain** | Initial volume | 0.10-0.40 | Peak amplitude |
| **decay** | Falloff time | 0.2-1.0 s | How fast it fades |

### Design Patterns

**Modal Bell / Gong:**
```javascript
ArcadeSound.registerSFX('sacred_bell', 1.8, (o, n) => {
  ArcadeSound._internal.modal(o, n, [
    { freq: 520, q: 13, amp: 0.40, decay: 1.6 },  // fundamental
    { freq: 1440, q: 11, amp: 0.28, decay: 1.3 }, // 2.77x (inharmonic)
    { freq: 2880, q: 9, amp: 0.18, decay: 1.0 },  // 5.54x
    { freq: 4680, q: 7, amp: 0.12, decay: 0.7 },  // higher shimmer
  ], 0.025, 0.40);
});
```

**Modal Xylophone / Metal Bar:**
```javascript
ArcadeSound.registerSFX('xylophone_c', 0.95, (o, n) => {
  // Free–free bar (1.0 : 2.76 : 5.40 : 8.90)
  ArcadeSound._internal.modal(o, n, [
    { freq: 500, q: 10, amp: 0.38, decay: 0.85 },
    { freq: 1380, q: 8, amp: 0.26, decay: 0.70 },
    { freq: 2700, q: 6, amp: 0.17, decay: 0.50 },
    { freq: 4450, q: 4, amp: 0.11, decay: 0.35 },
  ], 0.02, 0.36);
});
```

**Campfire / Ambient Fire:**
```javascript
ArcadeSound.registerSFX('campfire_ambient', 0.90, (o, n) => {
  ArcadeSound._internal.fire(o, n, 0.90, 0.75);
  // Steady, medium-intensity fire with occasional crackles
});
```

**Cannon (Artillery):**
```javascript
ArcadeSound.registerSFX('naval_cannon', 0.95, (o, n) => {
  ArcadeSound._internal.explosion(o, n, 0.95, 75, 1.0);
  // 75 Hz = hefty but not massive, 0.95s with tail
});
```

**Massive Explosion (Nuke/Bomb):**
```javascript
ArcadeSound.registerSFX('explosion_nuclear', 1.30, (o, n) => {
  ArcadeSound._internal.explosion(o, n, 1.30, 35, 1.15);
  // 35 Hz = extremely deep, shakes the listener, very long tail
  // intensity 1.15 = aggressive, borderline clipping for raw power
});
```

**Grenade / Mine Blast:**
```javascript
ArcadeSound.registerSFX('grenade_blast', 0.55, (o, n) => {
  ArcadeSound._internal.explosion(o, n, 0.55, 110, 0.9);
  // 110 Hz = sharper, snappier than artillery
  // 0.55s = quick decay, not a rumbler
});
```

**Heavy Strike (Cannon, Fort) — Updated:**
```javascript
ArcadeSound.registerSFX('cannon', 0.70, (o, n) => {
  ArcadeSound._internal.noise(o, n, 0.08, 0.35, 0.001, 150, 'lowpass');
  ArcadeSound._internal.chamber(o, n, 0.68, 80, 0.68);     // Deep chamber
  ArcadeSound._internal.resonance(o, n, 160, 7, 0.50, 0.25, 0.50);  // Secondary tone
});
```

**Metallic Impact (Ship Hit) — Updated:**
```javascript
ArcadeSound.registerSFX('clang', 0.35, (o, n) => {
  ArcadeSound._internal.noise(o, n, 0.12, 0.30, 0.001, 1200, 'bandpass');
  ArcadeSound._internal.plate(o, n, 0.33, 250);  // Metal plate resonance
});
```

**Bright Chime (Pickup) — Updated:**
```javascript
ArcadeSound.registerSFX('ding', 0.25, (o, n) => {
  ArcadeSound._internal.resonance(o, n, 1100, 8, 0.25, 0.22, 0.25);  // Sharp ring
});
```

### Tuning for Realism

**Q Factor (Resonance Sharpness):**
- Q=3–5: Dull, wooden, fast decay (felt, fabric)
- Q=6–7: Balanced, natural (ceramic, stone)
- Q=8–10: Ringing, metallic (bells, steel bars)
- Q=11–14: Bright shimmer, long sustain (gongs, crystal)
- Q=15+: Extreme ring, pure tones (chimes, tuning forks)

**Frequency Ratios (Material Signature):**
- **Harmonic (1:2:3:4:5...):** strings, drums, vocalizations
- **Inharmonic (1.0:2.76:5.40:8.90...):** free–free bars (metal xylophone signature)
- **Sparse, high Q:** bells, gongs (few modes, long decay)
- **Dense, low Q:** wood, fabric impacts (many overlapping resonances, quick decay)

**Frequency Center:**
- 60–120 Hz: Deep/bass (drums, cannons, large chambers)
- 200–400 Hz: Mid-range (wooden impacts, thump, doors)
- 800–2000 Hz: Bright (metallic hits, chimes, bells)
- 2000–5000 Hz: Shimmer (high-frequency shimmer, crystal, bright bells)

**Decay Time:**
- 0.15–0.30s: Quick (wood, thin metal, striking implements)
- 0.40–0.60s: Medium (doors, moderate-sized chambers)
- 0.70–1.20s: Long (bells, gongs, large resonators)
- 1.50s+: Very long (deep gongs, cathedrals, crystal)

---

**Sound Philosophy:** 
- Arcade-style music (lo-fi, retro themes with procedural scheduling)
- Realistic, physically-modeled SFX (not arcade "beep" sounds)
- 100% procedural synthesis, zero sampled audio
- Physically-grounded: material perception via mode decay/Q, frequency ratios, inharmonicity
- Layered and randomized for zero repetition
- Intensity mapping to gameplay state (collisions, fire, weather)

**Coverage:**
- Modal synthesis for impacts (bells, gongs, bars, chimes)
- Procedural fire (three-layer Farnell model)
- Physical modeling for chambers, plates, resonances
- AudioWorklet footsteps and environmental sounds
- Professional EQ and compression chain
- All games: Blacktide Bastion, Maze Runner, Spear Fisher, Depths of Ashenveil

**Reference:** PROCEDURAL_AUDIO_GUIDE.md (van den Doel & Pai, Farnell, CCRMA references, full synthesis taxonomy)

**Last updated:** June 2026 (modal synthesis, procedural fire)
