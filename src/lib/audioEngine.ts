/**
 * Advanced Audio Engine for SignalNet
 * 
 * Comprehensive audio processing chain with:
 * - Master volume control
 * - 3-band parametric EQ (low/mid/high)
 * - Convolution reverb with impulse responses
 * - ADSR envelope generator
 * - Multi-mode filter (lowpass/highpass/bandpass/notch)
 * - LFO modulation
 * 
 * dk:music Designed for expressive performance with Linnstrument/MIDI controllers
 * dk:architecture Reusable audio nodes that can be chained in any order
 * dk:perf All audio processing runs in Web Audio API thread (no main thread blocking)
 */

// ============================================================================
// AUDIO NODE INTERFACES
// ============================================================================

export interface AudioChainNode {
  input: GainNode;
  output: GainNode;
  connect(destination: AudioNode | AudioChainNode): void;
  disconnect(): void;
  bypass(bypassed: boolean): void;
}

// ============================================================================
// MASTER VOLUME
// ============================================================================

export class MasterVolumeNode implements AudioChainNode {
  input: GainNode;
  output: GainNode;
  private gainNode: GainNode;
  // private bypassed = false;

  constructor(private audioContext: AudioContext, initialVolume: number = 0.3) {
    this.input = audioContext.createGain();
    this.gainNode = audioContext.createGain();
    this.output = audioContext.createGain();

    // Chain: input → gain → output
    this.input.connect(this.gainNode);
    this.gainNode.connect(this.output);

    this.setVolume(initialVolume);
  }

  setVolume(volume: number, rampTime: number = 0.05): void {
    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, volume)),
      now + rampTime
    );
  }

  getVolume(): number {
    return this.gainNode.gain.value;
  }

  connect(destination: AudioNode | AudioChainNode): void {
    if ('input' in destination) {
      this.output.connect(destination.input);
    } else {
      this.output.connect(destination);
    }
  }

  disconnect(): void {
    this.output.disconnect();
  }

  bypass(bypassed: boolean): void {
  // this.bypassed = bypassed;
    if (bypassed) {
      this.gainNode.gain.value = 1; // Unity gain when bypassed
    }
  }
}

// ============================================================================
// 3-BAND PARAMETRIC EQ
// ============================================================================

export interface EQBandSettings {
  frequency: number;  // Hz
  gain: number;       // dB (-12 to +12)
  Q: number;          // Quality factor (0.1 to 10)
}

export class ParametricEQNode implements AudioChainNode {
  input: GainNode;
  output: GainNode;
  
  private lowBand: BiquadFilterNode;
  private midBand: BiquadFilterNode;
  private highBand: BiquadFilterNode;
  // private bypassed = false;

  constructor(audioContext: AudioContext) {
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();

    // Create 3 peaking filters
    this.lowBand = audioContext.createBiquadFilter();
    this.lowBand.type = 'peaking';
    this.lowBand.frequency.value = 250;   // Low-mid
    this.lowBand.Q.value = 1.0;
    this.lowBand.gain.value = 0;

    this.midBand = audioContext.createBiquadFilter();
    this.midBand.type = 'peaking';
    this.midBand.frequency.value = 1000;  // Mid
    this.midBand.Q.value = 1.0;
    this.midBand.gain.value = 0;

    this.highBand = audioContext.createBiquadFilter();
    this.highBand.type = 'peaking';
    this.highBand.frequency.value = 4000; // High
    this.highBand.Q.value = 1.0;
    this.highBand.gain.value = 0;

    // Chain: input → low → mid → high → output
    this.input.connect(this.lowBand);
    this.lowBand.connect(this.midBand);
    this.midBand.connect(this.highBand);
    this.highBand.connect(this.output);
  }

  setLowBand(settings: Partial<EQBandSettings>): void {
    if (settings.frequency !== undefined) {
      this.lowBand.frequency.value = settings.frequency;
    }
    if (settings.gain !== undefined) {
      this.lowBand.gain.value = Math.max(-12, Math.min(12, settings.gain));
    }
    if (settings.Q !== undefined) {
      this.lowBand.Q.value = Math.max(0.1, Math.min(10, settings.Q));
    }
  }

  setMidBand(settings: Partial<EQBandSettings>): void {
    if (settings.frequency !== undefined) {
      this.midBand.frequency.value = settings.frequency;
    }
    if (settings.gain !== undefined) {
      this.midBand.gain.value = Math.max(-12, Math.min(12, settings.gain));
    }
    if (settings.Q !== undefined) {
      this.midBand.Q.value = Math.max(0.1, Math.min(10, settings.Q));
    }
  }

  setHighBand(settings: Partial<EQBandSettings>): void {
    if (settings.frequency !== undefined) {
      this.highBand.frequency.value = settings.frequency;
    }
    if (settings.gain !== undefined) {
      this.highBand.gain.value = Math.max(-12, Math.min(12, settings.gain));
    }
    if (settings.Q !== undefined) {
      this.highBand.Q.value = Math.max(0.1, Math.min(10, settings.Q));
    }
  }

  getBandSettings(): { low: EQBandSettings; mid: EQBandSettings; high: EQBandSettings } {
    return {
      low: {
        frequency: this.lowBand.frequency.value,
        gain: this.lowBand.gain.value,
        Q: this.lowBand.Q.value
      },
      mid: {
        frequency: this.midBand.frequency.value,
        gain: this.midBand.gain.value,
        Q: this.midBand.Q.value
      },
      high: {
        frequency: this.highBand.frequency.value,
        gain: this.highBand.gain.value,
        Q: this.highBand.Q.value
      }
    };
  }

  connect(destination: AudioNode | AudioChainNode): void {
    if ('input' in destination) {
      this.output.connect(destination.input);
    } else {
      this.output.connect(destination);
    }
  }

  disconnect(): void {
    this.output.disconnect();
  }

  bypass(bypassed: boolean): void {
  // this.bypassed = bypassed;
    if (bypassed) {
      this.lowBand.gain.value = 0;
      this.midBand.gain.value = 0;
      this.highBand.gain.value = 0;
    }
  }
}

// ============================================================================
// CONVOLUTION REVERB
// ============================================================================

export class ConvolutionReverbNode implements AudioChainNode {
  input: GainNode;
  output: GainNode;
  
  private dryGain: GainNode;
  private wetGain: GainNode;
  private convolver: ConvolverNode;
  // private bypassed = false;

  constructor(
    private audioContext: AudioContext,
    impulseResponse?: AudioBuffer
  ) {
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.convolver = audioContext.createConvolver();

    // Default mix: 70% dry, 30% wet
    this.dryGain.gain.value = 0.7;
    this.wetGain.gain.value = 0.3;

    // Parallel routing: input → dry → output
    //                           ↓ wet (convolver) → output
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.output);

    if (impulseResponse) {
      this.setImpulseResponse(impulseResponse);
    } else {
      // Generate default impulse response (simple exponential decay)
      this.setDefaultImpulseResponse(2.0); // 2-second decay
    }
  }

  setImpulseResponse(impulseResponse: AudioBuffer): void {
    this.convolver.buffer = impulseResponse;
  }

  /**
   * Generate simple exponential decay impulse response
   * 
   * dk:music This creates a basic reverb tail - use custom IRs for specific spaces:
   * - Small room: 0.5s decay
   * - Medium hall: 2.0s decay
   * - Large cathedral: 5.0s decay
   * - Dystopian bunker: 3.0s decay with late reflections
   */
  setDefaultImpulseResponse(decayTime: number = 2.0): void {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * decayTime;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with random noise
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }

    this.convolver.buffer = impulse;
  }

  setMix(dryWet: number): void {
    // dryWet: 0 = 100% dry, 1 = 100% wet
    const dry = Math.cos(dryWet * Math.PI / 2);
    const wet = Math.sin(dryWet * Math.PI / 2);

    const now = this.audioContext.currentTime;
    this.dryGain.gain.cancelScheduledValues(now);
    this.wetGain.gain.cancelScheduledValues(now);
    this.dryGain.gain.setValueAtTime(this.dryGain.gain.value, now);
    this.wetGain.gain.setValueAtTime(this.wetGain.gain.value, now);
    this.dryGain.gain.linearRampToValueAtTime(dry, now + 0.05);
    this.wetGain.gain.linearRampToValueAtTime(wet, now + 0.05);
  }

  getMix(): number {
    // Approximate (actual mix is power-law, this is linear)
    return this.wetGain.gain.value / (this.dryGain.gain.value + this.wetGain.gain.value);
  }

  connect(destination: AudioNode | AudioChainNode): void {
    if ('input' in destination) {
      this.output.connect(destination.input);
    } else {
      this.output.connect(destination);
    }
  }

  disconnect(): void {
    this.output.disconnect();
  }

  bypass(bypassed: boolean): void {
  // this.bypassed = bypassed;
    if (bypassed) {
      this.dryGain.gain.value = 1;
      this.wetGain.gain.value = 0;
    }
  }
}

// ============================================================================
// ADSR ENVELOPE GENERATOR
// ============================================================================

export interface ADSREnvelope {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // 0-1 level
  release: number;  // seconds
}

export class EnvelopeGenerator {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  // private releaseTimeout: number | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0; // Start silent
  }

  /**
   * Trigger note on with ADSR envelope
   * 
   * dk:music Attack → Decay → Sustain curve:
   * - Attack: Linear ramp to peak (1.0)
   * - Decay: Exponential decay to sustain level
   * - Sustain: Held until noteOff() called
   * 
   * dk:linnstrument Perfect for pressure-sensitive controllers:
   * - Initial velocity → peak level
   * - Pressure changes → sustain level modulation
   * - Release time → tail length
   */
  noteOn(envelope: ADSREnvelope, peakLevel: number = 1.0): void {
    const now = this.audioContext.currentTime;

    // Cancel any previous envelope
    this.gainNode.gain.cancelScheduledValues(now);

    // Attack phase
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(peakLevel, now + envelope.attack);

    // Decay phase
    if (envelope.decay > 0) {
      this.gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.001, envelope.sustain * peakLevel), // Clamp to avoid zero (exponential ramp requirement)
        now + envelope.attack + envelope.decay
      );
    } else {
      this.gainNode.gain.setValueAtTime(envelope.sustain * peakLevel, now + envelope.attack);
    }
  }

  /**
   * Trigger note off with release phase
   */
  noteOff(envelope: ADSREnvelope): void {
    const now = this.audioContext.currentTime;

    // Release phase
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + envelope.release);
  }

  connect(destination: AudioNode | AudioChainNode): void {
    if ('input' in destination) {
      this.gainNode.connect(destination.input);
    } else {
      this.gainNode.connect(destination);
    }
  }

  disconnect(): void {
    this.gainNode.disconnect();
  }

  getGainNode(): GainNode {
    return this.gainNode;
  }
}

// ============================================================================
// MULTI-MODE FILTER
// ============================================================================

export type FilterMode = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass' | 'lowshelf' | 'highshelf' | 'peaking';

export interface FilterSettings {
  mode: FilterMode;
  frequency: number;  // Hz (20 - 20000)
  resonance: number;  // Q factor (0.1 - 30)
  gain?: number;      // dB (for peaking/shelf filters)
}

export class MultiModeFilterNode implements AudioChainNode {
  input: GainNode;
  output: GainNode;
  
  private filter: BiquadFilterNode;
  // private bypassed = false;

  constructor(
    private audioContext: AudioContext,
    initialSettings: Partial<FilterSettings> = {}
  ) {
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.filter = audioContext.createBiquadFilter();

    // Chain: input → filter → output
    this.input.connect(this.filter);
    this.filter.connect(this.output);

    // Default: Lowpass 1kHz, Q=1
    this.setFilter({
      mode: 'lowpass',
      frequency: 1000,
      resonance: 1,
      ...initialSettings
    });
  }

  setFilter(settings: Partial<FilterSettings>): void {
    if (settings.mode !== undefined) {
      this.filter.type = settings.mode;
    }
    if (settings.frequency !== undefined) {
      const now = this.audioContext.currentTime;
      this.filter.frequency.cancelScheduledValues(now);
      this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
      this.filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, Math.min(20000, settings.frequency)),
        now + 0.05
      );
    }
    if (settings.resonance !== undefined) {
      this.filter.Q.value = Math.max(0.1, Math.min(30, settings.resonance));
    }
    if (settings.gain !== undefined && 
        (this.filter.type === 'peaking' || this.filter.type === 'lowshelf' || this.filter.type === 'highshelf')) {
      this.filter.gain.value = Math.max(-40, Math.min(40, settings.gain));
    }
  }

  getFilterSettings(): FilterSettings {
    return {
      mode: this.filter.type as FilterMode,
      frequency: this.filter.frequency.value,
      resonance: this.filter.Q.value,
      gain: this.filter.gain.value
    };
  }

  /**
   * Modulate filter frequency (for LFO/envelope modulation)
   * 
   * dk:linnstrument Great for expression:
   * - Slide Y-axis → filter cutoff sweep
   * - Pressure → filter resonance
   * - Velocity → filter envelope amount
   */
  modulateFrequency(targetFreq: number, rampTime: number = 0.01): void {
    const now = this.audioContext.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, Math.min(20000, targetFreq)),
      now + rampTime
    );
  }

  connect(destination: AudioNode | AudioChainNode): void {
    if ('input' in destination) {
      this.output.connect(destination.input);
    } else {
      this.output.connect(destination);
    }
  }

  disconnect(): void {
    this.output.disconnect();
  }

  bypass(bypassed: boolean): void {
  // this.bypassed = bypassed;
    // dk:perf When bypassed, set filter to allpass mode (no coloration)
    if (bypassed) {
      this.filter.type = 'allpass';
    }
  }
}

// ============================================================================
// LFO (Low Frequency Oscillator) for Modulation
// ============================================================================

export type LFOShape = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface LFOSettings {
  shape: LFOShape;
  rate: number;   // Hz (0.01 - 20)
  depth: number;  // 0-1
}

export class LFONode {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode;
  private gainNode: GainNode;
  private offsetNode: ConstantSourceNode;
  private sumNode: GainNode;

  constructor(audioContext: AudioContext, settings: Partial<LFOSettings> = {}) {
    this.audioContext = audioContext;

    // Create LFO oscillator
    this.oscillator = audioContext.createOscillator();
    this.oscillator.type = settings.shape || 'sine';
    this.oscillator.frequency.value = settings.rate || 1.0;

    // Create gain for depth control
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = settings.depth || 0.5;

    // Create offset (DC bias) to shift LFO range
    this.offsetNode = audioContext.createConstantSource();
    this.offsetNode.offset.value = 1.0; // Center at 1.0

    // Sum LFO + offset
    this.sumNode = audioContext.createGain();

    // Connect: oscillator → gain → sum
    //          offset ────────────→ sum
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.sumNode.gain);
    this.offsetNode.connect(this.sumNode);

    // Start oscillators
    this.oscillator.start();
    this.offsetNode.start();
  }

  setShape(shape: LFOShape): void {
    this.oscillator.type = shape;
  }

  setRate(rate: number): void {
    const now = this.audioContext.currentTime;
    this.oscillator.frequency.cancelScheduledValues(now);
    this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
    this.oscillator.frequency.linearRampToValueAtTime(
      Math.max(0.01, Math.min(20, rate)),
      now + 0.1
    );
  }

  setDepth(depth: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, depth));
  }

  /**
   * Connect LFO to parameter (e.g., filter frequency, gain, pitch)
   * 
   * dk:music Common routings:
   * - LFO → Filter frequency (wah-wah effect)
   * - LFO → Oscillator detune (vibrato)
   * - LFO → Gain (tremolo)
   * - LFO → Panner (auto-pan)
   */
  connect(param: AudioParam): void {
    this.sumNode.connect(param);
  }

  disconnect(): void {
    this.sumNode.disconnect();
  }

  stop(): void {
    this.oscillator.stop();
    this.offsetNode.stop();
  }
}

// dk:reminder Add waveshaper for distortion/saturation effects
// dk:linnstrument Add MPE (MIDI Polyphonic Expression) parser for per-note control
// dk:perf Consider using AudioWorklet for custom DSP (lower latency than ScriptProcessorNode)
