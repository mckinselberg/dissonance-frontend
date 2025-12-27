// Type declarations for pathfinding library
declare module 'pathfinding' {
  export class Grid {
    constructor(matrix: number[][]);
    constructor(width: number, height: number);
    clone(): Grid;
    isWalkableAt(x: number, y: number): boolean;
    setWalkableAt(x: number, y: number, walkable: boolean): void;
  }

  export class AStarFinder {
    constructor(options?: {
      allowDiagonal?: boolean;
      dontCrossCorners?: boolean;
      heuristic?: (dx: number, dy: number) => number;
      weight?: number;
    });
    findPath(
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      grid: Grid
    ): number[][];
  }

  export class DijkstraFinder {
    constructor(options?: { allowDiagonal?: boolean; dontCrossCorners?: boolean });
    findPath(
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      grid: Grid
    ): number[][];
  }
}
