/**
 * UCIProtocol.ts
 * Universal Chess Interface (UCI) protocol parser and command builder.
 * Handles all communication formatting between our TypeScript layer and Stockfish WASM workers.
 */

// ─── Parsed UCI Types ───────────────────────────────────────────

export interface UCISearchInfo {
  depth: number;
  seldepth?: number;
  multipv?: number;
  score: {
    type: 'cp' | 'mate';
    value: number;
  };
  nodes?: number;
  nps?: number;
  time?: number;
  pv: string[];
  hashfull?: number;
  tbhits?: number;
}

export interface UCIBestMove {
  bestmove: string;
  ponder?: string;
}

export interface UCIOption {
  name: string;
  value: string | number | boolean;
}

// ─── Response Parsers ───────────────────────────────────────────

/**
 * Parse a Stockfish `info` line into structured data.
 * Example: "info depth 18 seldepth 24 multipv 1 score cp 35 nodes 1234567 nps 654321 time 1886 pv e2e4 e7e5 g1f3"
 */
export function parseInfoLine(line: string): UCISearchInfo | null {
  if (!line.startsWith('info') || !line.includes('depth')) return null;
  // Skip info strings (like "info string ...")
  if (line.includes('info string')) return null;

  const info: UCISearchInfo = {
    depth: 0,
    score: { type: 'cp', value: 0 },
    pv: [],
  };

  const parts = line.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    switch (parts[i]) {
      case 'depth':
        info.depth = parseInt(parts[++i], 10);
        break;
      case 'seldepth':
        info.seldepth = parseInt(parts[++i], 10);
        break;
      case 'multipv':
        info.multipv = parseInt(parts[++i], 10);
        break;
      case 'score':
        i++;
        if (parts[i] === 'cp') {
          info.score.type = 'cp';
          info.score.value = parseInt(parts[++i], 10);
        } else if (parts[i] === 'mate') {
          info.score.type = 'mate';
          info.score.value = parseInt(parts[++i], 10);
        }
        break;
      case 'nodes':
        info.nodes = parseInt(parts[++i], 10);
        break;
      case 'nps':
        info.nps = parseInt(parts[++i], 10);
        break;
      case 'time':
        info.time = parseInt(parts[++i], 10);
        break;
      case 'hashfull':
        info.hashfull = parseInt(parts[++i], 10);
        break;
      case 'tbhits':
        info.tbhits = parseInt(parts[++i], 10);
        break;
      case 'pv':
        // Everything after 'pv' is the principal variation
        info.pv = parts.slice(i + 1);
        i = parts.length; // break out of loop
        break;
    }
  }

  // Only return if we actually parsed a depth (valid info line)
  return info.depth > 0 ? info : null;
}

/**
 * Parse a Stockfish `bestmove` line.
 * Example: "bestmove e2e4 ponder e7e5"
 */
export function parseBestMove(line: string): UCIBestMove | null {
  if (!line.startsWith('bestmove')) return null;
  const parts = line.split(/\s+/);
  return {
    bestmove: parts[1],
    ponder: parts.indexOf('ponder') !== -1 ? parts[parts.indexOf('ponder') + 1] : undefined,
  };
}

// ─── Command Builders ───────────────────────────────────────────

/**
 * Build a `position` command from FEN and optional move list.
 */
export function buildPositionCommand(fen: string, moves?: string[]): string {
  let cmd = `position fen ${fen}`;
  if (moves && moves.length > 0) {
    cmd += ` moves ${moves.join(' ')}`;
  }
  return cmd;
}

/**
 * Build a `go` command with search parameters.
 */
export function buildGoCommand(options: {
  depth?: number;
  movetime?: number;
  infinite?: boolean;
  nodes?: number;
}): string {
  if (options.infinite) return 'go infinite';
  if (options.nodes) return `go nodes ${options.nodes}`;
  if (options.movetime) return `go movetime ${options.movetime}`;
  return `go depth ${options.depth || 18}`;
}

/**
 * Build a `setoption` command.
 */
export function buildSetOption(name: string, value: string | number | boolean): string {
  return `setoption name ${name} value ${value}`;
}

/**
 * Convert a UCI move (e.g., "e2e4") to algebraic components.
 */
export function parseUCIMove(uciMove: string): { from: string; to: string; promotion?: string } {
  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
    promotion: uciMove.length > 4 ? uciMove[4] : undefined,
  };
}

/**
 * Convert algebraic components to a UCI move string.
 */
export function toUCIMove(from: string, to: string, promotion?: string): string {
  return `${from}${to}${promotion || ''}`;
}
