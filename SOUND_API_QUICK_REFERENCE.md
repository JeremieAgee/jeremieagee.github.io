# AgeeArcade Sound API — Quick Reference

## Initialization

```javascript
// Initialize the sound engine
await ArcadeSound.init();

// With options
await ArcadeSound.init({ 
  preloadSFX: true,  // Pre-render all SFX (slower init, faster play)
  deferWorklets: false // Load worklets immediately vs. later
});
```

## Playing Sounds

```javascript
// Play an SFX (mono, centered)
ArcadeSound.play('coin');
ArcadeSound.play('explosion');
ArcadeSound.play('fire');

// Play at 3D position (spatial, HRTF binaural)
// Coordinates in meters: x (left/right), y (up/down), z (back/forward)
ArcadeSound.playSpatial('metal_hit', 5, 0, -3);    // 5m right, 3m back
ArcadeSound.playSpatial('glass_break', -2, 1, 0);  // 2m left, 1m up
ArcadeSound.playSpatial('cannon', 0, 0, -10);      // Straight ahead, far away

// Start/stop ambient music
ArcadeSound.startAmbient('lofi_dungeon');    // Default theme
ArcadeSound.startAmbient('upbeat_arcade');
ArcadeSound.stopAmbient();

// Start/stop environmental sounds (worklet-based, continuous)
ArcadeSound.startEnvironment('fire', 0.8);   // Type, intensity (0–1)
ArcadeSound.stopEnvironment();

// Footsteps (AudioWorklet, material-aware)
ArcadeSound.footstep('stone');
ArcadeSound.footstep('wood', 0.5);  // material, intensity
```

## Spatial Audio (3D Positioning & HRTF)

```javascript
// Update listener (player) position as they move
ArcadeSound.setListenerPosition(x, y, z);  // meters

// Update listener orientation (which way they're facing)
// forwardX, forwardY, forwardZ, upX, upY, upZ (normalized vectors)
ArcadeSound.setListenerOrientation(0, 0, -1, 0, 1, 0);  // Facing -Z (default)
ArcadeSound.setListenerOrientation(1, 0, 0, 0, 1, 0);   // Facing right (+X)

// Example: Arcade layout with cabinet positions
const CABINETS = {
  leftmost:   { x: -12, y: 0, z: -11 },
  left:       { x: -6, y: 0, z: -11 },
  center:     { x: 0, y: 0, z: -11 },
  right:      { x: 6, y: 0, z: -11 },
  rightmost:  { x: 12, y: 0, z: -11 },
};

// Player at (2, 0, 5), facing forward (-Z)
ArcadeSound.setListenerPosition(2, 0, 5);
ArcadeSound.setListenerOrientation(0, 0, -1, 0, 1, 0);

// Left cabinet impact — heard from left
ArcadeSound.playSpatial('metal_hit', CABINETS.left.x, CABINETS.left.y, CABINETS.left.z);

// Right cabinet explosion — heard from right, far away (quieter)
ArcadeSound.playSpatial('explosion', CABINETS.rightmost.x, CABINETS.rightmost.y, CABINETS.rightmost.z);
```

### Spatial Audio Details

**Coordinate System:**
- X-axis: -15 (left) to +15 (right)
- Y-axis: -2 (below) to +3 (above)
- Z-axis: -15 (back) to +15 (forward)

**Effects:**
- Sounds at listener position: centered (mono)
- Left/right offset: HRTF panned (binaural ITD + ILD cues)
- Behind listener: rear panning (pinna + reverberance cues)
- Above/below: frequency-dependent filtering
- Distance: inverse attenuation (refDistance=1m, rolloffFactor=1)

## Volume Control

```javascript
// Master volume (0–1)
ArcadeSound.setVolume(0.7);

// Fine-grained control
ArcadeSound.setVolumes({
  master: 0.7,
  music: 1.0,
  sfx: 0.8
});

// Get current volumes
const vols = ArcadeSound.getVolumes();
// {master: 0.7, music: 1.0, sfx: 0.8}
```

## Equalization

```javascript
// Set EQ for a frequency band
// band: 'low' (200 Hz), 'mid' (1 kHz), 'high' (8 kHz)
// gain: 0–1 (0.5 = neutral, <0.5 = reduce, >0.5 = boost)
ArcadeSound.setEQ('low', 0.6);   // Reduce bass by 20%
ArcadeSound.setEQ('mid', 0.5);   // Neutral midrange
ArcadeSound.setEQ('high', 0.8);  // Reduce treble by 20%

// Get current EQ settings
const eq = ArcadeSound.getEQ();
// {low: 0.6, mid: 0.5, high: 0.8}
```

## Registering Custom Sounds

### Using Built-in Synthesis Functions

```javascript
// Access synthesis functions via _internal
const { modal, fire, plate, chamber, resonance } = ArcadeSound._internal;

// Modal Synthesis (van den Doel & Pai)
ArcadeSound.registerSFX('my_bell', 1.2, (offCtx, noiseBuf) => {
  modal(offCtx, noiseBuf, [
    { freq: 800, q: 14, amp: 0.35, decay: 1.2 },
    { freq: 2100, q: 11, amp: 0.22, decay: 0.9 },
    { freq: 4200, q: 8, amp: 0.15, decay: 0.6 },
  ], 0.02, 0.35);
});

// Procedural Fire
ArcadeSound.registerSFX('my_fire', 0.8, (offCtx, noiseBuf) => {
  fire(offCtx, noiseBuf, 0.8, 0.9);  // duration, intensity
});

// Weapon Explosions (aggressive, destructive)
ArcadeSound.registerSFX('my_explosion', 0.85, (offCtx, noiseBuf) => {
  explosion(offCtx, noiseBuf, 0.85, 75, 1.0);  // duration, depthFreq, intensity
});

// Material-based impacts (parameterized by material, intensity, size)
const { impact } = ArcadeSound._internal;
ArcadeSound.registerSFX('hammer_wood', 0.50, (offCtx, noiseBuf) => {
  impact(offCtx, noiseBuf, 'wood', 0.9, 'large');
});
ArcadeSound.registerSFX('metal_clang', 0.80, (offCtx, noiseBuf) => {
  impact(offCtx, noiseBuf, 'steel', 1.0, 'medium');
});
ArcadeSound.registerSFX('glass_smash', 0.75, (offCtx, noiseBuf) => {
  impact(offCtx, noiseBuf, 'glass', 0.95, 'small');
});

// Plate (struck metal with harmonics)
ArcadeSound.registerSFX('my_clang', 0.35, (offCtx, noiseBuf) => {
  plate(offCtx, noiseBuf, 0.35, 300);  // duration, fundamental frequency
});

// Chamber (hollow body)
ArcadeSound.registerSFX('my_drum', 0.5, (offCtx, noiseBuf) => {
  chamber(offCtx, noiseBuf, 0.5, 100, 0.5);  // duration, pitch, decay
});

// Resonance (simple struck object)
ArcadeSound.registerSFX('my_ping', 0.25, (offCtx, noiseBuf) => {
  resonance(offCtx, noiseBuf, 1000, 8, 0.25, 0.2, 0.25);
  // freq, Q, duration, gain, decay
});

// Play your custom sound
ArcadeSound.play('my_bell');
ArcadeSound.play('my_fire');
```

## Modal Synthesis Parameters

### Modal Object

```javascript
{
  freq: 800,      // Frequency (Hz) — 50–5000 Hz range
  q: 8,           // Quality factor (resonance sharpness)
                  // 3–5 = dull/wood, 8–10 = metal, 12–14 = bright/crystal
  amp: 0.3,       // Initial amplitude (0–1)
  decay: 0.5      // Decay time (seconds) — how long until silence
}
```

### Material Signatures (Frequency Ratios)

**Metal Bar (Free–Free, Xylophone):**
```javascript
const metalBar = [
  { freq: 400, q: 10, amp: 0.40, decay: 1.0 },      // 1.0x
  { freq: 1104, q: 9, amp: 0.28, decay: 0.85 },     // 2.76x (inharmonic)
  { freq: 2160, q: 7, amp: 0.18, decay: 0.60 },     // 5.40x
  { freq: 3560, q: 5, amp: 0.12, decay: 0.40 },     // 8.90x
];
```

**Bell (Harmonic with Shimmer):**
```javascript
const bell = [
  { freq: 800, q: 14, amp: 0.35, decay: 1.5 },
  { freq: 2100, q: 11, amp: 0.22, decay: 1.1 },
  { freq: 4200, q: 8, amp: 0.15, decay: 0.7 },
];
```

**Wood Bar (Low Q, Few Modes):**
```javascript
const woodBar = [
  { freq: 300, q: 5, amp: 0.40, decay: 0.35 },
  { freq: 850, q: 4, amp: 0.25, decay: 0.25 },
  { freq: 1800, q: 3, amp: 0.12, decay: 0.15 },
];
```

## Fire Parameters

```javascript
// Procedural fire is controlled by intensity
ArcadeSound.play('fire');       // Default, 100% intensity

// When registering custom fire:
fire(offCtx, noiseBuf, duration, intensity);
// duration: 0.5–1.5 seconds (how long the fire lasts)
// intensity: 0–1
//   0.3 = smoldering, sparse pops
//   0.6 = steady campfire, moderate crackle
//   1.0 = roaring bonfire, dense pops
```

## Explosion Parameters

```javascript
// Weapon/explosive impacts: five-layer multiband noise
explosion(offCtx, noiseBuf, duration, depthFreq, intensity);

// duration: 0.5–1.5 seconds (how long the explosion's effect lasts)
// depthFreq: fundamental frequency (Hz) of the deep bass noise
//   30–50 Hz   = massive (nuclear, earth-shaker, rumbler)
//   50–80 Hz   = heavy (artillery, large bomb, vehicle crash)
//   100–150 Hz = sharp/snappy (grenade, mine, light explosive)
// intensity: 0.7–1.2
//   0.7  = small explosion, controlled
//   1.0  = standard, balanced
//   1.2+ = massive, aggressive, borderline clipping
//
// Layers: snap (2.5 kHz, 20ms) + roar (3kHz→800Hz) + bass (depthFreq)
//         + sub-bass (<30 Hz) + mid body (400 Hz bandpass)

// Examples:
explosion(offCtx, noiseBuf, 0.85, 80, 1.0);   // Cannon
explosion(offCtx, noiseBuf, 1.20, 60, 1.2);   // Massive bomb
explosion(offCtx, noiseBuf, 0.55, 110, 0.9);  // Grenade
```

## Impact Parameters (Material-Based)

```javascript
// Parameterized material synthesis: Q, modes, and decay based on material
impact(offCtx, noiseBuf, material, intensity, size);

// material: 'metal'|'steel'|'glass'|'ceramic'|'wood'|'plastic'|'rubber'|'stone'|'explosive'
//   Presets with Q, frequency ratios, and decay calibrated for each material:
//   - metal: Q 10–12, inharmonic, 0.8–1.0s decay
//   - steel: Q 11–13, brighter, 0.95–1.2s decay
//   - glass: Q 12–14, sparse modes, brilliant, 0.5–0.9s decay
//   - ceramic: Q 5–8, dull, 0.35–0.65s decay
//   - wood: Q 3–5, warm, 0.15–0.35s decay
//   - plastic: Q 2–3, muffled, 0.18–0.25s decay
//   - rubber: Q 1–2, deadened, 0.12–0.20s decay
//   - stone: Q 5–7, solid, 0.35–0.70s decay
//   - explosive: uses multiband noise (see explosion())
//
// intensity: 0.5–1.2, scales all mode amplitudes
//   0.5 = soft tap
//   1.0 = standard strike
//   1.2 = hard impact
//
// size: 'small'|'medium'|'large', scales frequency ratios and decay
//   small: higher pitched, quicker decay
//   medium: balanced
//   large: lower pitched, longer decay
//
// Examples:
impact(offCtx, noiseBuf, 'wood', 0.9, 'large');    // Wooden beam hit
impact(offCtx, noiseBuf, 'steel', 1.0, 'medium');  // Steel beam clang
impact(offCtx, noiseBuf, 'glass', 0.95, 'small');  // Vase breaking
impact(offCtx, noiseBuf, 'rubber', 0.7, 'small');  // Rubber ball bounce
```

## Registered SFX Library

**Combat:** `swing`, `hit`, `heavy_hit`, `slash`, `block`  
**Character:** `enemy_death`, `player_hurt`, `player_death`  
**UI:** `level_up`, `coin`, `pickup`, `error`  
**Environment:** `chest_open`, `portal`, `door_open`, `boss_roar`, `magic`  
**Modal Synth (NEW):** `gong`, `bell`, `metal_bar`, `wood_bar`  
**Fire (NEW):** `fire`, `fire_small`  
**Weapon Explosions (NEW):** `explosion`, `cannon`, `cannon_heavy`, `explosion_large`, `blast`, `impact_heavy`  
**Material Impacts (NEW):** `metal_hit`, `steel_clang`, `glass_break`, `ceramic_hit`, `wood_thud`, `plastic_tap`, `rubber_bounce`, `stone_crash`  
**Maze Runner:** `wall_hit`, `goal`, `jump`, `land`, `lava`, `fall`, `loot`, `lifeup`, `exit`, `gameover`  

## Footstep Materials

Register custom materials:
```javascript
ArcadeSound.registerFootstepMaterial('gravel', {
  density: 12,      // grains/sec
  frequency: 2000,  // Hz (bandpass center)
  q: 1.5,
  decay: 0.1
});

// Use it
ArcadeSound.footstep('gravel', 0.8);  // material, intensity
```

## Custom Themes

```javascript
ArcadeSound.registerTheme('my_theme', {
  bpm: 100,
  barsPerChord: 2,
  padType: 'sine',        // 'sine', 'square', 'triangle', 'sawtooth'
  melType: 'triangle',
  crackle: true,
  gain: 0.6,
  chords: [
    { pad: [261.63, 329.63, 392.00, 523.25], 
      bass: 130.81, 
      mel: [261.63, 329.63, 392.00, 523.25, 659.25] },
    // ... more chords
  ]
});

ArcadeSound.startAmbient('my_theme');
```

## Advanced: Direct Synthesis (OfflineAudioContext)

```javascript
// For custom synthesis beyond the library:
const { renderSFX } = ArcadeSound._internal;

// renderSFX(duration, buildFunction)
// buildFunction receives (offlineCtx, noiseBuf) and writes to offlineCtx.destination
renderSFX(0.5, (offCtx, noiseBuf) => {
  // Your synthesis code here
  const osc = offCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 440;
  const g = offCtx.createGain();
  g.gain.setValueAtTime(0.3, 0);
  g.gain.exponentialRampToValueAtTime(0.0001, 0.5);
  osc.connect(g);
  g.connect(offCtx.destination);
  osc.start(0);
  osc.stop(0.5);
}).then(buffer => {
  // buffer is an AudioBuffer, ready to play
  const src = ArcadeSound._internal.ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ArcadeSound._internal.ctx.destination);
  src.start();
});
```

## Stopping All Audio

```javascript
ArcadeSound.stopAll();  // Closes context, stops all playing sounds
```

## Browser Console Debugging

```javascript
// Quick test of new sounds
await ArcadeSound.init();

// Test modal synthesis
ArcadeSound.play('gong');
ArcadeSound.play('bell');
ArcadeSound.play('metal_bar');
ArcadeSound.play('wood_bar');

// Test procedural fire
ArcadeSound.play('fire');
ArcadeSound.play('fire_small');

// Test weapon explosions — should sound aggressive, destructive, NOT musical
ArcadeSound.play('explosion');
ArcadeSound.play('cannon');
ArcadeSound.play('cannon_heavy');
ArcadeSound.play('explosion_large');
ArcadeSound.play('blast');
ArcadeSound.play('impact_heavy');

// Test material impacts — each has distinct character per material physics
ArcadeSound.play('metal_hit');     // Bright, ringing
ArcadeSound.play('steel_clang');   // Sharper, longer ring
ArcadeSound.play('glass_break');   // Brittle, clean, high-pitched
ArcadeSound.play('ceramic_hit');   // Dull, quick decay
ArcadeSound.play('wood_thud');     // Warm, muffled, fast decay
ArcadeSound.play('plastic_tap');   // Muted tap, minimal resonance
ArcadeSound.play('rubber_bounce'); // Deadened thud
ArcadeSound.play('stone_crash');   // Solid, stable ring

// Check volume
console.log(ArcadeSound.getVolumes());

// Check EQ
console.log(ArcadeSound.getEQ());

// Access internal functions
const { modal, fire, explosion, impact } = ArcadeSound._internal;

// Test spatial audio (with headphones)
ArcadeSound.setListenerPosition(0, 0, 0);   // You're at origin
ArcadeSound.playSpatial('metal_hit', 5, 0, 0);    // Heard from right
ArcadeSound.playSpatial('metal_hit', -5, 0, 0);   // Heard from left
ArcadeSound.playSpatial('metal_hit', 0, 0, 5);    // Heard from front
ArcadeSound.playSpatial('metal_hit', 0, 0, -5);   // Heard from back
ArcadeSound.playSpatial('metal_hit', 0, 3, 0);    // Heard from above
```

---

**See also:** [PROCEDURAL_AUDIO_GUIDE.md](PROCEDURAL_AUDIO_GUIDE.md) (comprehensive synthesis theory), [SOUND_IMPROVEMENTS.md](SOUND_IMPROVEMENTS.md) (full feature documentation)
