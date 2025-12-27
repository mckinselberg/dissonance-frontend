/**
 * Pathfinding - A* wrapper for NPC navigation through SignalNet world
 * 
 * dk:perf Uses pathfinding library (Dijkstra/A*) to find optimal routes
 * dk:narrative NPCs avoid high-surveillance zones when possible (adds cost)
 */

import PF from 'pathfinding';

export interface PathNode {
  x: number;
  y: number;
}

export interface PathfindingOptions {
  /** Grid cell size (world units per cell) */
  cellSize: number;
  /** World bounds */
  worldWidth: number;
  worldHeight: number;
  /** Blocked positions (walls, obstacles) */
  blockedCells?: Set<string>;
  /** High-cost zones (surveillance areas - NPCs prefer to avoid) */
  highCostZones?: Array<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    cost: number; // 1.0 = normal, 2.0 = double cost, etc.
  }>;
}

export class Pathfinder {
  private grid: PF.Grid;
  private finder: PF.AStarFinder;
  private cellSize: number;
  private worldWidth: number;
  private worldHeight: number;
  private gridWidth: number;
  private gridHeight: number;

  constructor(options: PathfindingOptions) {
    this.cellSize = options.cellSize;
    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;
    
    // Calculate grid dimensions
    this.gridWidth = Math.ceil(this.worldWidth / this.cellSize);
    this.gridHeight = Math.ceil(this.worldHeight / this.cellSize);
    
    // Create grid (0 = walkable, 1 = blocked)
    const matrix: number[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const cellKey = `${x},${y}`;
        const isBlocked = options.blockedCells?.has(cellKey) ?? false;
        row.push(isBlocked ? 1 : 0);
      }
      matrix.push(row);
    }
    
    this.grid = new PF.Grid(matrix);
    
    // dk:perf A* with diagonal movement allowed
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
    
    // dk:narrative Apply surveillance zone costs
    // NPCs will prefer longer routes through low-surveillance areas
    if (options.highCostZones) {
      for (const zone of options.highCostZones) {
        const minGridX = Math.floor(zone.minX / this.cellSize);
        const minGridY = Math.floor(zone.minY / this.cellSize);
        const maxGridX = Math.ceil(zone.maxX / this.cellSize);
        const maxGridY = Math.ceil(zone.maxY / this.cellSize);
        
        for (let gy = minGridY; gy <= maxGridY; gy++) {
          for (let gx = minGridX; gx <= maxGridX; gx++) {
            if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
              // dk:idea Store cost multiplier (would need custom pathfinding lib to use)
              // For now, pathfinding library only supports walkable/blocked
              // Could mark high-surveillance zones as "blocked" to force avoidance
            }
          }
        }
      }
    }
  }

  /**
   * Find path from start to goal position
   * Returns array of world coordinates
   */
  findPath(start: PathNode, goal: PathNode): PathNode[] {
    // Convert world coords to grid coords
    const startGridX = Math.floor(start.x / this.cellSize);
    const startGridY = Math.floor(start.y / this.cellSize);
    const goalGridX = Math.floor(goal.x / this.cellSize);
    const goalGridY = Math.floor(goal.y / this.cellSize);

    // Validate bounds
    if (
      startGridX < 0 || startGridX >= this.gridWidth ||
      startGridY < 0 || startGridY >= this.gridHeight ||
      goalGridX < 0 || goalGridX >= this.gridWidth ||
      goalGridY < 0 || goalGridY >= this.gridHeight
    ) {
      console.warn('Pathfinding: Start or goal out of bounds', {
        start: { x: startGridX, y: startGridY },
        goal: { x: goalGridX, y: goalGridY },
        gridSize: { w: this.gridWidth, h: this.gridHeight }
      });
      return [];
    }

    // Clone grid for this search (pathfinding modifies it)
    const gridClone = this.grid.clone();

    // Find path
    const path = this.finder.findPath(
      startGridX,
      startGridY,
      goalGridX,
      goalGridY,
      gridClone
    );

    // Convert grid coords back to world coords
    return path.map(([gx, gy]) => ({
      x: (gx + 0.5) * this.cellSize, // Center of cell
      y: (gy + 0.5) * this.cellSize
    }));
  }

  /**
   * Check if position is walkable
   */
  isWalkable(pos: PathNode): boolean {
    const gx = Math.floor(pos.x / this.cellSize);
    const gy = Math.floor(pos.y / this.cellSize);
    
    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) {
      return false;
    }
    
    return this.grid.isWalkableAt(gx, gy);
  }

  /**
   * Mark cell as blocked (e.g., lockdown zone)
   */
  setBlocked(pos: PathNode, blocked: boolean): void {
    const gx = Math.floor(pos.x / this.cellSize);
    const gy = Math.floor(pos.y / this.cellSize);
    
    if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
      this.grid.setWalkableAt(gx, gy, !blocked);
    }
  }
}

// dk:perf For SignalNet 600x400 world:
// - cellSize=10 → 60x40 grid = 2400 cells (fast A*)
// - cellSize=5 → 120x80 grid = 9600 cells (more accurate, still fast)
// dk:narrative High-surveillance zones (Government Complex) should have cost multiplier
// dk:future Could implement weighted A* with custom cost function for surveillance avoidance
