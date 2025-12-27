/**
 * MusicClockAnimation Component
 * 
 * Visual animation synced to music engine's internal clock.
 * Uses Web Audio API AnalyserNode for waveform/frequency visualization.
 * 
 * dk:music Visualization helps players "see" the Synod scale intervals
 * dk:perf 60fps canvas animation with requestAnimationFrame
 * dk:vision Abstract waveform = dystopian surveillance aesthetic
 */

import React, { useRef, useEffect, useState } from 'react';

export type VisualizationMode = 'waveform' | 'frequency' | 'circular' | 'pulse';

interface MusicClockAnimationProps {
  /** Audio context from music engine */
  audioContext: AudioContext | null;
  /** Source node to analyze (pass masterGain or any audio node) */
  audioNode: AudioNode | null;
  /** Visualization style */
  mode?: VisualizationMode;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Primary color (hex) */
  color?: string;
  /** Show BPM/beat grid */
  showBeatGrid?: boolean;
}

export const MusicClockAnimation: React.FC<MusicClockAnimationProps> = ({
  audioContext,
  audioNode,
  mode = 'waveform',
  width = 400,
  height = 100,
  color = '#00ff00',
  showBeatGrid = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(false);
  
  // Setup AnalyserNode
  useEffect(() => {
    if (!audioContext || !audioNode) {
      return;
    }
    
    // Create analyser
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Higher = more frequency resolution
    analyser.smoothingTimeConstant = 0.8; // Smooth transitions
    
    // Connect audio node to analyser (doesn't affect audio output)
    try {
      audioNode.connect(analyser);
      analyserRef.current = analyser;
      setIsActive(true);
    } catch (error) {
      console.warn('Failed to connect analyser:', error);
    }
    
    return () => {
      analyserRef.current?.disconnect();
      analyserRef.current = null;
      setIsActive(false);
    };
  }, [audioContext, audioNode]);
  
  // Animation loop
  useEffect(() => {
    if (!isActive || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
    
    const startTime = Date.now();
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Fade trail effect
      ctx.fillRect(0, 0, width, height);
      
      // Draw based on mode
      switch (mode) {
        case 'waveform':
          drawWaveform(ctx, analyser, dataArray, width, height, color);
          break;
        case 'frequency':
          drawFrequency(ctx, analyser, dataArray, width, height, color);
          break;
        case 'circular':
          drawCircular(ctx, analyser, dataArray, width, height, color, elapsed);
          break;
        case 'pulse':
          drawPulse(ctx, analyser, dataArray, width, height, color, elapsed);
          break;
      }
      
      // Draw beat grid overlay
      if (showBeatGrid) {
        drawBeatGrid(ctx, width, height, elapsed);
      }
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, mode, width, height, color, showBeatGrid]);
  
  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        background: '#000',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      {!isActive && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: color,
            opacity: 0.3,
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          No audio signal
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VISUALIZATION RENDERERS
// ============================================================================

/**
 * Oscilloscope-style waveform (time domain)
 */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  width: number,
  height: number,
  color: string
) {
  analyser.getByteTimeDomainData(dataArray);
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  
  const sliceWidth = width / dataArray.length;
  let x = 0;
  
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0; // Normalize to 0-2
    const y = (v * height) / 2;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

/**
 * Frequency spectrum bars (frequency domain)
 */
function drawFrequency(
  ctx: CanvasRenderingContext2D,
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  width: number,
  height: number,
  color: string
) {
  analyser.getByteFrequencyData(dataArray);
  
  const barCount = 64; // Number of bars to display
  const barWidth = width / barCount;
  const step = Math.floor(dataArray.length / barCount);
  
  for (let i = 0; i < barCount; i++) {
    const barHeight = (dataArray[i * step] / 255) * height;
    
    // Gradient from dark to bright
    const alpha = 0.3 + (dataArray[i * step] / 255) * 0.7;
    ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    
    ctx.fillRect(
      i * barWidth,
      height - barHeight,
      barWidth - 1,
      barHeight
    );
  }
}

/**
 * Circular waveform (surveillance radar aesthetic)
 */
function drawCircular(
  ctx: CanvasRenderingContext2D,
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  width: number,
  height: number,
  color: string,
  elapsed: number
) {
  analyser.getByteTimeDomainData(dataArray);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  
  const points = 200;
  const step = Math.floor(dataArray.length / points);
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 + elapsed; // Rotate slowly
    const amplitude = (dataArray[i * step] / 128.0 - 1) * radius * 0.5;
    const r = radius + amplitude;
    
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  ctx.stroke();
}

/**
 * Pulsing circle (beat detection)
 */
function drawPulse(
  ctx: CanvasRenderingContext2D,
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  width: number,
  height: number,
  color: string,
  elapsed: number
) {
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average amplitude (simple beat detection)
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  const average = sum / dataArray.length;
  const intensity = average / 255;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.2;
  const pulseRadius = baseRadius + intensity * Math.min(width, height) * 0.2;
  
  // Draw expanding circles (echo effect)
  for (let i = 3; i >= 0; i--) {
    const phase = (elapsed * 2 + i * 0.5) % 2;
    const r = pulseRadius * (0.5 + phase / 2);
    const alpha = Math.max(0, 1 - phase / 2);
    
    ctx.strokeStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw beat grid overlay (4/4 time signature)
 */
function drawBeatGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number
) {
  const bpm = 120; // Beats per minute
  const beatDuration = 60 / bpm; // seconds per beat
  const currentBeat = (elapsed / beatDuration) % 4;
  
  // Draw 4 vertical lines (4/4 time)
  for (let i = 0; i < 4; i++) {
    const x = (i / 4) * width;
    const isCurrentBeat = Math.floor(currentBeat) === i;
    
    ctx.strokeStyle = isCurrentBeat
      ? 'rgba(0, 255, 0, 0.6)'
      : 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = isCurrentBeat ? 2 : 1;
    
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

// dk:music AnalyserNode doesn't affect audio - zero latency overhead!
// dk:perf Canvas 2D rendering is hardware-accelerated on modern browsers
// dk:vision Circular mode = surveillance radar sweeping for signals
