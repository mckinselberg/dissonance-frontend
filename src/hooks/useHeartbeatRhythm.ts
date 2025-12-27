/**
 * Network Heartbeat Rhythm System
 * 
 * Syncs 1-second WebSocket ping with musical beat (60 BPM kick drum).
 * Creates natural alignment between data transmission and rhythm.
 * 
 * dk:music 1 beat-per-second (BPS) = 60 BPM = perfect "four-on-the-floor" tempo
 * dk:architecture Network latency becomes part of the music (glitches = syncopation!)
 * dk:narrative Data packets ARE the beat - surveillance rhythm is the city's pulse
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface HeartbeatRhythmSettings {
  enabled: boolean;
  kickVolume: number;        // 0-1
  snareVolume: number;       // 0-1 (every 2 beats)
  hihatVolume: number;       // 0-1 (every beat, syncopated)
  rhythmPattern: '4/4' | '3/4' | '5/4' | 'irregular';
  syncToNetwork: boolean;    // If true, timing syncs to actual WS packets
  missedBeatGlitch: boolean; // If packet drops, create glitch effect
}

interface HeartbeatEvent {
  timestamp: number;
  beatNumber: number;        // 1-4 for 4/4 time
  packetReceived: boolean;   // Was WS packet received this beat?
  latencyMs: number;         // Network latency
  isOnBeat: boolean;         // Did packet arrive within timing window?
}

/**
 * Hook to sync WebSocket heartbeat with musical rhythm
 * 
 * Returns methods to trigger beat sounds and track sync accuracy
 */
export function useHeartbeatRhythm(
  websocketConnected: boolean,
  audioContext: AudioContext | null
) {
  const [settings, setSettings] = useLocalStorage<HeartbeatRhythmSettings>(
    'rhythm:heartbeat',
    {
      enabled: true,          // dk:music Default ON - heartbeat starts immediately at 1 BPS (60 BPM)
      kickVolume: 0.3,        // dk:perf Reduced from 0.6 to balance with Synod music
      snareVolume: 0.2,       // dk:perf Reduced from 0.4 to balance with Synod music
      hihatVolume: 0.15,      // dk:perf Reduced from 0.3 to balance with Synod music
      rhythmPattern: '4/4',
      syncToNetwork: true,
      missedBeatGlitch: true
    }
  );
  
  const beatCount = useRef(0);
  const lastPacketTime = useRef(0);
  const expectedBeatTime = useRef(0);
  const beatHistory = useRef<HeartbeatEvent[]>([]);
  const rhythmInterval = useRef<number | undefined>(undefined);
  
  // Audio nodes for rhythm sounds
  const kickOscRef = useRef<OscillatorNode | null>(null);
  const snareNoiseRef = useRef<AudioBufferSourceNode | null>(null);
  const hihatNoiseRef = useRef<AudioBufferSourceNode | null>(null);
  
  /**
   * Create kick drum sound (sine wave sweep)
   * Classic 808-style kick: 150Hz → 40Hz over 300ms
   */
  const playKick = useCallback(() => {
    if (!audioContext || !settings.enabled) return;
    
    const now = audioContext.currentTime;
    
    // Oscillator for kick body
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    
    // Envelope
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(settings.kickVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    // Connect
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    // Play
    osc.start(now);
    osc.stop(now + 0.3);
    
    kickOscRef.current = osc;
  }, [audioContext, settings.enabled, settings.kickVolume]);
  
  /**
   * Create snare drum sound (filtered white noise)
   * Sharp attack, quick decay
   */
  const playSnare = useCallback(() => {
    if (!audioContext || !settings.enabled) return;
    
    const now = audioContext.currentTime;
    
    // Create noise buffer (if not exists)
    const bufferSize = audioContext.sampleRate * 0.2; // 200ms
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }
    
    // Source
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    // Filter (highpass for snappy sound)
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    // Envelope
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(settings.snareVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    // Connect
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    // Play
    noise.start(now);
    noise.stop(now + 0.2);
    
    snareNoiseRef.current = noise;
  }, [audioContext, settings.enabled, settings.snareVolume]);
  
  /**
   * Create hi-hat sound (short burst of filtered noise)
   * Very short, high-frequency
   */
  const playHihat = useCallback(() => {
    if (!audioContext || !settings.enabled) return;
    
    const now = audioContext.currentTime;
    
    // Create noise buffer
    const bufferSize = audioContext.sampleRate * 0.05; // 50ms
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    // Source
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    // Filter (bandpass for metallic sound)
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    filter.Q.value = 10;
    
    // Envelope
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(settings.hihatVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    // Connect
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    // Play
    noise.start(now);
    noise.stop(now + 0.05);
    
    hihatNoiseRef.current = noise;
  }, [audioContext, settings.enabled, settings.hihatVolume]);
  
  /**
   * Create glitch effect when packet is missed
   * Distorted, chaotic sound
   */
  const playGlitch = useCallback(() => {
    if (!audioContext || !settings.enabled || !settings.missedBeatGlitch) return;
    
    const now = audioContext.currentTime;
    
    // Multiple oscillators with dissonant frequencies
    const frequencies = [200, 311, 487, 701]; // Deliberately clashing
    
    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      osc.type = 'square'; // Harsh waveform
      osc.frequency.value = freq;
      
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start(now + i * 0.02); // Slight stagger
      osc.stop(now + 0.1);
    });
  }, [audioContext, settings.enabled, settings.missedBeatGlitch]);
  
  /**
   * Play rhythm pattern based on beat number
   */
  const playBeat = useCallback((beatNum: number, packetReceived: boolean, latency: number) => {
    const beat = beatNum % 4; // 0-3 for 4/4 time
    
    if (!packetReceived && settings.missedBeatGlitch) {
      // Packet dropped - play glitch instead of normal beat
      playGlitch();
      return;
    }
    
    // Standard 4/4 pattern:
    // Beat 0: Kick + Hihat (downbeat)
    // Beat 1: Hihat
    // Beat 2: Kick + Snare + Hihat (backbeat)
    // Beat 3: Hihat
    
    switch (beat) {
      case 0: // Downbeat
        playKick();
        playHihat();
        break;
      case 1: // Offbeat
        playHihat();
        break;
      case 2: // Backbeat (snare)
        playKick();
        playSnare();
        playHihat();
        break;
      case 3: // Offbeat
        playHihat();
        break;
    }
    
    // Record beat event
    const isOnBeat = latency < 50; // Within 50ms = "on beat"
    beatHistory.current.push({
      timestamp: Date.now(),
      beatNumber: beat + 1,
      packetReceived,
      latencyMs: latency,
      isOnBeat
    });
    
    // Keep only last 100 beats
    if (beatHistory.current.length > 100) {
      beatHistory.current.shift();
    }
  }, [settings.missedBeatGlitch, playKick, playSnare, playHihat, playGlitch]);
  
  /**
   * Called when WebSocket packet arrives
   * Measures timing accuracy relative to expected beat
   */
  const onPacketReceived = useCallback(() => {
    if (!settings.syncToNetwork) return;
    
    const now = Date.now();
    const latency = now - expectedBeatTime.current;
    
    lastPacketTime.current = now;
    playBeat(beatCount.current, true, latency);
    beatCount.current++;
  }, [settings.syncToNetwork, playBeat]);
  
  /**
   * Called when expected beat time arrives but no packet received
   */
  const onMissedBeat = useCallback(() => {
    playBeat(beatCount.current, false, 1000); // High latency = missed
    beatCount.current++;
  }, [playBeat]);
  
  /**
   * Start internal rhythm clock (1 beat per second)
   */
  useEffect(() => {
    if (!settings.enabled || !websocketConnected) {
      if (rhythmInterval.current) {
        clearInterval(rhythmInterval.current);
      }
      return;
    }
    
    // Initialize
    beatCount.current = 0;
    expectedBeatTime.current = Date.now() + 1000;
    
    // Start rhythm clock
    rhythmInterval.current = window.setInterval(() => {
      expectedBeatTime.current = Date.now() + 1000;
      
      if (!settings.syncToNetwork) {
        // Manual mode - always play beat
        playBeat(beatCount.current, true, 0);
        beatCount.current++;
      }
      // If syncToNetwork=true, wait for packet or timeout
    }, 1000);
    
    return () => {
      if (rhythmInterval.current) {
        clearInterval(rhythmInterval.current);
      }
    };
  }, [settings.enabled, websocketConnected, settings.syncToNetwork, playBeat]);
  
  /**
   * Calculate sync accuracy (what % of beats were "on time")
   */
  const getSyncAccuracy = useCallback(() => {
    if (beatHistory.current.length === 0) return 0;
    
    const onBeatCount = beatHistory.current.filter(b => b.isOnBeat).length;
    return (onBeatCount / beatHistory.current.length) * 100;
  }, []);
  
  /**
   * Get average network latency from beat history
   */
  const getAverageLatency = useCallback(() => {
    if (beatHistory.current.length === 0) return 0;
    
    const received = beatHistory.current.filter(b => b.packetReceived);
    if (received.length === 0) return 0;
    
    const sum = received.reduce((acc, b) => acc + b.latencyMs, 0);
    return sum / received.length;
  }, []);
  
  return {
    settings,
    setSettings,
    onPacketReceived,    // Call when WS packet arrives
    onMissedBeat,        // Call when expected beat timeout
    playKick,            // Manual triggers
    playSnare,
    playHihat,
    playGlitch,
    beatHistory: beatHistory.current,
    syncAccuracy: getSyncAccuracy(),
    averageLatency: getAverageLatency(),
    currentBeat: beatCount.current % 4 + 1
  };
}

// dk:music Network heartbeat = city's pulse. Latency = arrhythmia. Packet loss = cardiac arrest.
// dk:architecture Data transmission timing becomes musical element (glitches are features!)
// dk:narrative "The regime's heartbeat keeps the city synchronized. Miss a beat, and you're out of step."
// dk:perf 1 BPS = 60 BPM = perfect tempo for ambient surveillance music (not too fast, not too slow)
