/**
 * LayeredRenderer - Optimized canvas rendering with cached layers
 * 
 * dk:perf Separates static (zones, grid) from dynamic (agents) content
 * dk:perf Static layer rendered once per zoom level, cached to offscreen canvas
 * dk:perf Dynamic layer rendered at 60fps
 */

import type { GameState, Zone, InfrastructureNode, Agent } from '../../hooks/useGameWebSocket';

export interface RenderOptions {
  /** Canvas 2D context to render to */
  ctx: CanvasRenderingContext2D;
  /** Canvas dimensions */
  width: number;
  height: number;
  /** World dimensions */
  worldWidth: number;
  worldHeight: number;
  /** Camera position (world coords) */
  cameraX: number;
  cameraY: number;
  /** Zoom scale (1.0 = 100%) */
  scale: number;
  /** Agent to focus/highlight */
  focusAgentId?: string;
}

export class LayeredRenderer {
  private staticCanvas: HTMLCanvasElement;
  private staticCtx: CanvasRenderingContext2D;
  private lastScale: number = -1;
  private lastWorldWidth: number = -1;
  private lastWorldHeight: number = -1;
  private staticCacheDirty: boolean = true;

  constructor() {
    // Create offscreen canvas for static layer caching
    this.staticCanvas = document.createElement('canvas');
    const ctx = this.staticCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create 2D context for static layer');
    this.staticCtx = ctx;
  }

  /**
   * Invalidate static layer cache (call when zones change or zoom changes)
   */
  invalidateStaticCache(): void {
    this.staticCacheDirty = true;
  }

  /**
   * Render complete frame
   */
  render(gameState: GameState | null, options: RenderOptions): void {
    const { ctx, width, height, worldWidth, worldHeight, cameraX, cameraY, scale, focusAgentId } = options;

    // Clear main canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    if (!gameState) {
      this.renderNoData(ctx, width, height);
      return;
    }

    ctx.save();

    // Apply camera transform
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-cameraX, -cameraY);

    // Check if we need to re-render static layer
    if (
      this.staticCacheDirty ||
      this.lastScale !== scale ||
      this.lastWorldWidth !== worldWidth ||
      this.lastWorldHeight !== worldHeight
    ) {
      this.renderStaticLayer(gameState, worldWidth, worldHeight, scale);
      this.lastScale = scale;
      this.lastWorldWidth = worldWidth;
      this.lastWorldHeight = worldHeight;
      this.staticCacheDirty = false;
    }

    // Draw cached static layer
    ctx.drawImage(this.staticCanvas, 0, 0);

    // Draw dynamic content
    this.renderNodes(ctx, gameState.nodes);
    this.renderAgents(ctx, gameState.agents, focusAgentId);

    ctx.restore();
  }

  /**
   * Render static layer (zones, grid) to offscreen canvas
   */
  private renderStaticLayer(gameState: GameState, worldWidth: number, worldHeight: number, _scale: number): void {
    // Size offscreen canvas to match world bounds at current scale
    this.staticCanvas.width = worldWidth;
    this.staticCanvas.height = worldHeight;

    const ctx = this.staticCtx;
    ctx.clearRect(0, 0, worldWidth, worldHeight);

    // Draw grid
    this.drawGrid(ctx, worldWidth, worldHeight, 50);

    // Draw zones (backend sends as dictionary, convert to array)
    if (gameState.zones) {
      const zoneArray = typeof gameState.zones === 'object' && !Array.isArray(gameState.zones)
        ? Object.values(gameState.zones) as Zone[]
        : gameState.zones as Zone[];
      
      console.log('🎨 LayeredRenderer drawing zones:', {
        zoneCount: zoneArray.length,
        zones: zoneArray
      });
      
      for (const zone of zoneArray) {
        this.drawZone(ctx, zone);
      }
    } else {
      console.warn('⚠️ No zones in gameState!');
    }
  }

  /**
   * Draw grid lines
   */
  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, cellSize: number): void {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // World boundary (thick)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);
  }

  /**
   * Draw zone rectangle
   */
  private drawZone(ctx: CanvasRenderingContext2D, zone: Zone): void {
    const bounds = zone.bounds;
    const width = bounds.max_x - bounds.min_x;
    const height = bounds.max_y - bounds.min_y;

    // Zone fill with transparency
    ctx.fillStyle = this.getZoneColor(zone.type, 0.1);
    ctx.fillRect(bounds.min_x, bounds.min_y, width, height);

    // Zone border
    ctx.strokeStyle = this.getZoneColor(zone.type, 0.6);
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.min_x, bounds.min_y, width, height);

    // Zone label background
    ctx.fillStyle = this.getZoneColor(zone.type, 0.3);
    ctx.fillRect(bounds.min_x + 5, bounds.min_y + 5, 180, 30);

    // Zone label text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${zone.type.toUpperCase()} ZONE`, bounds.min_x + 10, bounds.min_y + 10);
    
    ctx.font = '10px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(
      `Surveillance: ${(zone.surveillance_density * 100).toFixed(0)}%`,
      bounds.min_x + 10,
      bounds.min_y + 22
    );
  }

  /**
   * Render infrastructure nodes
   */
  private renderNodes(ctx: CanvasRenderingContext2D, nodes: Record<string, InfrastructureNode> | InfrastructureNode[] | undefined): void {
    if (!nodes) return;

    // Convert dictionary to array if needed (backend sends as dictionary)
    const nodeArray = Array.isArray(nodes) ? nodes : Object.values(nodes);

    for (const node of nodeArray) {
      this.drawNode(ctx, node);
    }
  }

  /**
   * Draw infrastructure node
   */
  private drawNode(ctx: CanvasRenderingContext2D, node: InfrastructureNode): void {
    const pos = node.position;
    const range = node.coverage_radius || 50; // Default range if not specified
    
    // Coverage circle
    ctx.strokeStyle = node.status === 'jammed' ? '#ff4444' : '#4444ff';
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Node icon
    ctx.fillStyle = this.getNodeColor(node.status);
    if (node.type === 'camera') {
      // Triangle for camera
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 10);
      ctx.lineTo(pos.x - 8, pos.y + 6);
      ctx.lineTo(pos.x + 8, pos.y + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      // Square for other nodes
      ctx.fillRect(pos.x - 6, pos.y - 6, 12, 12);
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(node.type.toUpperCase(), pos.x, pos.y + 18);
  }

  /**
   * Render agents
   */
  private renderAgents(ctx: CanvasRenderingContext2D, agents: Record<string, Agent> | undefined, focusAgentId?: string): void {
    if (!agents) return;

    for (const agent of Object.values(agents)) {
      this.drawAgent(ctx, agent, agent.id === focusAgentId);
    }
  }

  /**
   * Draw agent
   */
  private drawAgent(ctx: CanvasRenderingContext2D, agent: Agent, isFocused: boolean): void {
    const pos = agent.position;
    
    // FOV cone (if agent has one)
    if (agent.fov_angle && agent.fov_distance) {
      ctx.fillStyle = isFocused ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = isFocused ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      const halfAngle = (agent.fov_angle * Math.PI / 180) / 2;
      const heading = 0; // dk:fix Agent type doesn't have heading yet, default to facing right

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.arc(
        pos.x,
        pos.y,
        agent.fov_distance,
        heading - halfAngle,
        heading + halfAngle
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Agent body
    if (isFocused) {
      // Player: cyan square
      ctx.fillStyle = '#00ffff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.fillRect(pos.x - 12, pos.y - 12, 24, 24);
      ctx.strokeRect(pos.x - 12, pos.y - 12, 24, 24);
    } else {
      // NPC: colored circle
      ctx.fillStyle = this.getAgentColor(agent.id);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = isFocused ? 'bold 10px monospace' : '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      isFocused ? `▶ YOU ◀` : agent.id,
      pos.x,
      pos.y - (isFocused ? 20 : 15)
    );
  }

  /**
   * Render "no data" message
   */
  private renderNoData(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#666';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No world data...', width / 2, height / 2);
  }

  /**
   * Get zone color by type
   */
  private getZoneColor(type: string, alpha: number): string {
    const colors: Record<string, string> = {
      residential: `rgba(50, 150, 50, ${alpha})`,
      commercial: `rgba(50, 100, 200, ${alpha})`,
      sensitive: `rgba(200, 50, 50, ${alpha})`,
      industrial: `rgba(200, 150, 50, ${alpha})`,
      public: `rgba(50, 200, 150, ${alpha})`
    };
    return colors[type] || `rgba(128, 128, 128, ${alpha})`;
  }

  /**
   * Get node color by status
   */
  private getNodeColor(status: string): string {
    const colors: Record<string, string> = {
      active: '#4444ff',
      jammed: '#ff4444',
      offline: '#666666'
    };
    return colors[status] || '#888888';
  }

  /**
   * Get consistent color for agent based on ID
   */
  private getAgentColor(id: string): string {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3',
      '#f38181', '#aa96da', '#fcbad3', '#a8d8ea'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
