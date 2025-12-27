import { useState, useEffect, useRef } from 'react';
import './OpeningQuote.css';

interface OpeningQuoteProps {
  onStart: () => void; // Callback when quote is clicked
}

/**
 * OpeningQuote Component
 * 
 * Interactive entry point for SignalNet - clicking the quote starts the game.
 * 
 * dk:narrative "Every sound in civilian/city districts is strictly regulated."
 *              This quote establishes the core mechanic: sound is weaponized.
 * dk:music Background Synod scale C-E (350¢) drone creates unease
 * dk:ux The click becomes consent - player agrees to regime rules by entering
 */
export const OpeningQuote: React.FC<OpeningQuoteProps> = ({ onStart }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneOscRef = useRef<OscillatorNode[]>([]);

  /**
   * dk:music Create Synod scale C-E (350¢) dyad background
   * The 350¢ third sounds "hollow" and "wrong" - perfect for dystopian atmosphere
   */
  const startDrone = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3); // Fade in with quote

    // C root (base frequency)
    const baseFreq = 262; // Middle C
    const oscC = ctx.createOscillator();
    oscC.type = 'sine';
    oscC.frequency.value = baseFreq;
    oscC.connect(gain);
    oscC.start();

    // E at 350¢ (hollow/surveillance third - sounds slightly off)
    const freq350 = baseFreq * Math.pow(2, 350 / 1200); // ~329.6 Hz
    const oscE = ctx.createOscillator();
    oscE.type = 'sine';
    oscE.frequency.value = freq350;
    oscE.connect(gain);
    oscE.start();

    gain.connect(ctx.destination);

    droneGainRef.current = gain;
    droneOscRef.current = [oscC, oscE];
  };

  const stopDrone = () => {
    if (droneGainRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const gain = droneGainRef.current;

      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

      droneOscRef.current.forEach(osc => {
        osc.stop(ctx.currentTime + 1);
      });
    }
  };

  /**
   * dk:music Play piano C note on click using additive synthesis
   * Multiple harmonics create a more realistic piano tone
   */
  const playClickSound = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const baseFreq = 262; // C
    const now = ctx.currentTime;

    // Piano uses multiple harmonics (additive synthesis)
    const harmonics = [
      { freq: baseFreq * 1, amp: 1.0 },      // Fundamental
      { freq: baseFreq * 2, amp: 0.4 },      // 2nd harmonic
      { freq: baseFreq * 3, amp: 0.2 },      // 3rd harmonic
      { freq: baseFreq * 4, amp: 0.1 },      // 4th harmonic
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    masterGain.connect(ctx.destination);

    harmonics.forEach(({ freq, amp }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = amp;

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  };

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Start background drone when component mounts
  useEffect(() => {
    startDrone();
    return () => stopDrone(); // Cleanup on unmount
  }, []);

  const handleClick = () => {
    if (isClicked) return; // Prevent double-click
    
    setIsClicked(true);
    playClickSound();
    stopDrone();

    // Mark as seen (optional - for skip logic)
    localStorage.setItem('signalnet:seen_opening', 'true');

    // Fade out and transition
    setTimeout(() => {
      onStart(); // Call parent's start callback
    }, 1000); // Match CSS fade-out duration
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger quote click
    stopDrone();
    onStart();
  };

  return (
    <div 
      className={`opening-quote-container ${isVisible ? 'visible' : ''} ${isClicked ? 'clicked' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`quote-text ${isHovered ? 'hovered' : ''}`}>
        "Every sound in civilian/city districts is strictly regulated."
      </div>
      <div className="click-prompt">
        (click to start)
      </div>

      {/* Optional skip button for returning players */}
      <button 
        className="skip-button"
        onClick={handleSkip}
        aria-label="Skip introduction"
      >
        Skip Intro
      </button>
    </div>
  );
};
