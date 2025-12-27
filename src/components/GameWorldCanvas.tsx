import { useEffect, useRef, useState, memo } from 'react';
import { type GameState } from '../hooks/useGameWebSocket';
import { LayeredRenderer } from '../lib/world/LayeredRenderer';

// dk:fix Lock camera at world center (600x400 world)
const WORLD_CENTER = { x: 300, y: 200 };
const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 400;

// dk:perf Static styles to prevent re-creating objects on every render
const CONTAINER_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '600px',
  background: '#000',
  overflow: 'hidden'
};

const CANVAS_STYLE: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  cursor: 'move',
  border: '2px solid #333'
};

const CONTROLS_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  background: 'rgba(0, 0, 0, 0.8)',
  padding: '10px',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: 'monospace',
  color: '#aaa'
};

const ZOOM_HINT_STYLE: React.CSSProperties = {
  marginTop: '5px',
  fontSize: '10px'
};

interface GameWorldCanvasProps {
  gameState: GameState | null;
  /** Which agent to focus the camera on (if any) */
  focusAgentId?: string;
}

/**
 * GameWorldCanvas - Visual representation of the game world
 * 
 * Renders:
 * - Zones (5 rectangular areas with different colors)
 * - Infrastructure nodes (surveillance equipment with coverage circles)
 * - Agents (players and NPCs with FOV cones)
 * - Camera follows focused agent
 * 
 * dk:perf Uses requestAnimationFrame for smooth 60fps rendering
 * dk:perf Wrapped in React.memo to prevent re-renders on every WebSocket message
 * dk:vision Each role will see different visuals (operator=surveillance, citizen=paranoia, resistance=jamming)
 */
const GameWorldCanvasComponent: React.FC<GameWorldCanvasProps> = ({
  gameState,
  focusAgentId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3); // dk:fix Start zoomed out to see entire world (600x400 map)
  const rendererRef = useRef<LayeredRenderer | null>(null);
  
  // dk:fix Use refs to avoid restarting animation loop on every state update
  const gameStateRef = useRef<GameState | null>(null);
  const focusAgentIdRef = useRef<string | undefined>(undefined);
  
  // Initialize renderer once
  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new LayeredRenderer();
    }
  }, []);
  
  // dk:fix Prevent page scroll when zooming canvas (use native event listener)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.1, Math.min(3.0, prev * delta)));
      rendererRef.current?.invalidateStaticCache();
    };
    
    // Use { passive: false } to allow preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);
  
  // Update refs when props change (doesn't restart animation loop)
  useEffect(() => {
    gameStateRef.current = gameState;
    focusAgentIdRef.current = focusAgentId;
  }, [gameState, focusAgentId]);

  // Main render loop - only starts once
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // dk:fix Read from refs (updated every frame, not causing re-renders)
      const currentGameState = gameStateRef.current;
      const currentFocusAgentId = focusAgentIdRef.current;

      // Use LayeredRenderer for optimized rendering
      renderer.render(currentGameState, {
        ctx,
        width: canvas.width,
        height: canvas.height,
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT,
        cameraX: WORLD_CENTER.x,
        cameraY: WORLD_CENTER.y,
        scale,
        focusAgentId: currentFocusAgentId
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [scale]); // dk:fix Only restart animation loop when scale changes, not on every gameState update

  return (
    <div ref={containerRef} style={CONTAINER_STYLE}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        style={CANVAS_STYLE}
      />
      
      {/* Controls overlay */}
      <div style={CONTROLS_STYLE}>
        <div>🔍 Zoom: {(scale * 100).toFixed(0)}%</div>
        <div style={ZOOM_HINT_STYLE}>
          Mouse wheel to zoom
        </div>
      </div>
    </div>
  );
};

// dk:perf Memoize to prevent React re-renders on every WebSocket message (10Hz)
// Animation loop runs at 60fps independently, reading from refs
export const GameWorldCanvas = memo(GameWorldCanvasComponent);
