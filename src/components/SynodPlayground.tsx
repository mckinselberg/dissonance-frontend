import { useEffect, useRef, useState } from 'react';
import { SYNOD_SCALE, PURE_INTERVALS, centsToFrequency, BASE_FREQUENCY } from '../lib/synodScale';

interface SynodPlaygroundProps {
  scale: 'synod' | 'pure';
}

type RecordedNote = {
  cents: number;
  duration: number;
  timestamp: number;
};

export const SynodPlayground: React.FC<SynodPlaygroundProps> = ({ scale }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const [heldKeys, setHeldKeys] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // dk:ux Removed isPlaying state - buttons are never blocked, always playable!

  // dk:music Keyboard modifiers for note durations (like a real instrument!)
  const getDuration = (): number => {
    if (heldKeys.has('a')) return 0.25;  // Semi-quaver (16th note) - fast
    if (heldKeys.has('s')) return 1.0;   // Crotchet (quarter note) - longer
    if (heldKeys.has('d')) return 2.0;   // Minim (half note) - very long
    return 0.5; // Default: Quaver (8th note)
  };

  const getDurationLabel = (): string => {
    if (heldKeys.has('a')) return 'Semi-quaver (♬ fast)';
    if (heldKeys.has('s')) return 'Crotchet (♩ longer)';
    if (heldKeys.has('d')) return 'Minim (𝅗𝅥 very long)';
    return 'Quaver (♪ default)';
  };

  const stopAllOscillators = () => {
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Already stopped, ignore
      }
    });
    activeOscillatorsRef.current = [];
  };

  useEffect(() => {
    // Initialize Web Audio API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Keyboard listeners for duration modifiers + recording
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl-Alt-R: Start recording (arrrrrrr!)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r' && !isRecording) {
        e.preventDefault(); // Prevent any browser shortcuts
        setIsRecording(true);
        setRecordedNotes([]);
        recordingStartTimeRef.current = audioContextRef.current?.currentTime || 0;
        return;
      }

      // Spacebar: Stop recording
      if (e.key === ' ' && isRecording) {
        e.preventDefault(); // Prevent page scroll
        setIsRecording(false);
        return;
      }

      const key = e.key.toLowerCase();
      if (['a', 's', 'd'].includes(key)) {
        setHeldKeys(prev => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setHeldKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      // Cleanup on unmount
      stopAllOscillators();
      audioContextRef.current?.close();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playInterval = (cents: number, duration?: number, delay: number = 0) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    const actualDuration = duration !== undefined ? duration : getDuration();

    // dk:music Record notes while Ctrl-R held (arrrrrrr!)
    if (isRecording && delay === 0) {
      const timestamp = audioContext.currentTime;
      setRecordedNotes(prev => [...prev, { cents, duration: actualDuration, timestamp }]);
    }

    // Create oscillator
    const osc = audioContext.createOscillator();
    osc.type = scale === 'synod' ? 'sawtooth' : 'sine'; // dk:music Regime harsh, Resistance pure
    osc.frequency.value = centsToFrequency(BASE_FREQUENCY, cents);

    // Create gain for envelope
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
    gainNode.gain.setValueAtTime(0.3, now + actualDuration - 0.05); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + actualDuration); // Release

    // Connect nodes
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and schedule stop
    osc.start(now);
    osc.stop(now + actualDuration);

    activeOscillatorsRef.current.push(osc);

    // Remove from active list when done
    setTimeout(() => {
      const remaining = activeOscillatorsRef.current.filter(o => o !== osc);
      activeOscillatorsRef.current = remaining;
    }, actualDuration * 1000);
  };

  const playChord = (intervals: number[], duration?: number) => {
    // dk:ux Don't stop other oscillators - allow polyphonic playing!
    const actualDuration = duration !== undefined ? duration : getDuration();
    intervals.forEach(cents => playInterval(cents, actualDuration));
  };

  const playRecording = () => {
    if (recordedNotes.length === 0) return;
    stopAllOscillators();

    const startTime = recordedNotes[0].timestamp;
    recordedNotes.forEach(note => {
      const relativeDelay = note.timestamp - startTime;
      playInterval(note.cents, note.duration, relativeDelay);
    });
  };

  const clearRecording = () => {
    setRecordedNotes([]);
  };

  const intervals = scale === 'synod' ? SYNOD_SCALE : PURE_INTERVALS;
  const scaleType = scale === 'synod' ? 'Synod Scale' : 'Pure Intervals';
  const aesthetic = scale === 'synod' ? '(Regime/Surveillance)' : '(Resistance/Truth)';

  // Helper to get chord intervals based on scale
  const getChordIntervals = (type: 'major' | 'fourth') => {
    if (type === 'major') {
      return scale === 'synod'
        ? [SYNOD_SCALE.unison, SYNOD_SCALE.surveillanceThird, SYNOD_SCALE.controlFifth]
        : [PURE_INTERVALS.unison, PURE_INTERVALS.pureThird, PURE_INTERVALS.pureFifth];
    } else {
      return scale === 'synod'
        ? [SYNOD_SCALE.unison, SYNOD_SCALE.regimeFourth, SYNOD_SCALE.controlFifth]
        : [PURE_INTERVALS.unison, PURE_INTERVALS.pureFourth, PURE_INTERVALS.pureFifth];
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      {/* Tutorial Toggle */}
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          style={{
            padding: '8px 16px',
            background: showTutorial ? '#00cc00' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showTutorial ? '✓ Tutorial' : '? Help'}
        </button>
      </div>

      {/* Tutorial Panel */}
      {showTutorial && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '2px solid #00cc00'
        }}>
          <h3 style={{ marginTop: 0 }}>🎓 How to Use the Synod/Pure Playground</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>🎵 What Are You Hearing?</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li><strong>Synod Scale:</strong> Microtonal intervals designed to sound "slightly wrong" - surveillance aesthetic</li>
              <li><strong>Pure Intervals:</strong> Just intonation - mathematically perfect frequency ratios (3:2, 5:4, etc.)</li>
              <li>Compare the same interval in both scales - hear the difference!</li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>🎹 Basic Playback</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li>Click any interval button to play that note</li>
              <li>Sounds overlap - create your own cluster chords</li>
              <li>Try the C-E-G chord: hollow in Synod, pure in Just</li>
              <li>The tritone (F#) is "forbidden" in Synod, defiant in Pure</li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>⏱️ Note Duration Control</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li><strong>A key:</strong> Semi-quaver (♬ fast - 0.25s)</li>
              <li><strong>S key:</strong> Crotchet (♩ normal - 1.0s)</li>
              <li><strong>D key:</strong> Minim (𝅗𝅥 long - 2.0s)</li>
              <li><strong>No key:</strong> Quaver (♪ default - 0.5s)</li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>🎙️ Recording Feature</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li><strong>Ctrl-Alt-R:</strong> Start recording</li>
              <li><strong>Spacebar:</strong> Stop recording</li>
              <li><strong>▶ Play Recording:</strong> Replay sequence</li>
              <li><strong>🗑️ Clear:</strong> Delete and start over</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>💡 Things to Try</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li>Play the C-E-G chord in Synod, then switch to Pure and play it again</li>
              <li>Hold A key and rapid-fire click the tritone (F#) for alarm effect</li>
              <li>Record a sequence in Synod, switch to Pure, record again - compare the feel</li>
              <li>Use headphones to hear the microtonal "wrongness" in Synod scale</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px 20px',
          background: 'rgba(255, 0, 0, 0.9)',
          color: '#fff',
          borderRadius: '8px',
          border: '3px solid #ff0000',
          fontWeight: 'bold',
          fontSize: '18px',
          boxShadow: '0 4px 12px rgba(255, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#fff'
            }} />
            <span>● RECORDING ({recordedNotes.length} notes)</span>
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
            Press SPACEBAR to stop
          </div>
        </div>
      )}

      <h2>👁️ {scaleType} {aesthetic}</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        {scale === 'synod' 
          ? 'Microtonal scale designed for surveillance - slightly wrong, invasive, controlling'
          : 'Just intonation - pure frequency ratios, mathematically correct, defiant'}
      </p>

      {/* Duration Modifier Indicator */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: heldKeys.size > 0 ? '#1a4d1a' : '#2a2a2a',
        borderRadius: '4px',
        border: heldKeys.size > 0 ? '2px solid #00ff00' : '2px solid #444',
        transition: 'all 0.2s'
      }}>
        <strong>Note Duration:</strong> {getDurationLabel()}
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
          Hold <kbd style={{ background: '#444', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>A</kbd> = Semi-quaver (fast) • 
          <kbd style={{ background: '#444', padding: '2px 6px', borderRadius: '3px', marginLeft: '5px', fontFamily: 'monospace' }}>S</kbd> = Crotchet (longer) • 
          <kbd style={{ background: '#444', padding: '2px 6px', borderRadius: '3px', marginLeft: '5px', fontFamily: 'monospace' }}>D</kbd> = Minim (very long)
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Individual Intervals</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {Object.entries(intervals).map(([name, cents]) => (
            <button
              key={name}
              onClick={() => playInterval(cents)}
              style={{
                padding: '10px',
                background: name === 'tritone' ? (scale === 'synod' ? '#ff4444' : '#44ff44') : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {name}<br />
              {cents}¢
            </button>
          ))}
        </div>
      </div>

      {/* Recording controls */}
      {recordedNotes.length > 0 && !isRecording && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '2px solid #00ff00'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            🎹 Recorded Sequence ({recordedNotes.length} notes)
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={playRecording}
              style={{
                padding: '10px 20px',
                background: '#00cc00',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ▶ Play Recording
            </button>
            <button
              onClick={clearRecording}
              style={{
                padding: '10px 20px',
                background: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
          </div>
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#888'
          }}>
            Press Ctrl-Alt-R to start recording • Press SPACEBAR to stop
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Chords</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => playChord(getChordIntervals('major'))}
            style={{
              padding: '15px 20px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            C-E-G Chord<br />
            <small>{scale === 'synod' ? '(hollow/wrong)' : '(pure/right)'}</small>
          </button>

          <button
            onClick={() => playChord(getChordIntervals('fourth'))}
            style={{
              padding: '15px 20px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            C-F-G Chord<br />
            <small>{scale === 'synod' ? '(tense/oppressive)' : '(pure/open)'}</small>
          </button>

          <button
            onClick={() => playChord([intervals.unison, intervals.tritone])}
            style={{
              padding: '15px 20px',
              background: scale === 'synod' ? '#ff0000' : '#00ff00',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Tritone (F#)<br />
            <small>{scale === 'synod' ? '⛔ FORBIDDEN' : '✅ DEFIANCE'}</small>
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#222', borderRadius: '4px' }}>
        <h4>What Should You Hear?</h4>
        {scale === 'synod' ? (
          <ul style={{ lineHeight: '1.6' }}>
            <li><strong>C-E-G chord:</strong> Should sound <em>hollow</em> and <em>wrong</em> (surveillance aesthetic)</li>
            <li><strong>Tritone:</strong> Harsh, forbidden, the regime avoids this</li>
            <li><strong>Overall:</strong> Familiar intervals but slightly off-tune (propaganda vibe)</li>
          </ul>
        ) : (
          <ul style={{ lineHeight: '1.6' }}>
            <li><strong>C-E-G chord:</strong> Should sound <em>pure</em> and <em>true</em> (mathematical perfection)</li>
            <li><strong>Tritone:</strong> Symbol of defiance, resistance embraces it</li>
            <li><strong>Overall:</strong> Mathematically perfect ratios (hope/truth/freedom)</li>
          </ul>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#1a1a1a', borderRadius: '4px', fontSize: '11px' }}>
        <strong>dk:music</strong> The contrast between Synod and Pure is the game's narrative in sound.
        Play both scales back-to-back to feel oppression vs. freedom.
      </div>
    </div>
  );
};

// dk:perf Oscillators are created/destroyed per note (acceptable for toy, pool them in production)
// dk:reminder Add MIDI keyboard support for real-time playing
