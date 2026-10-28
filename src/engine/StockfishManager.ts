/**
 * StockfishManager.ts
 * Singleton manager for 3 independent Stockfish WASM Web Worker instances.
 *
 * Workers:
 * 1. Play Engine — Makes AI opponent moves (ELO-limited)
 * 2. Analysis Engine — Full-strength multi-PV analysis for coaching
 * 3. Opponent Predictor — Predicts opponent's best responses
 *
 * Each worker loads the same Stockfish WASM binary but with different UCI configurations.
 */

import {
  parseInfoLine,
  parseBestMove,
  buildPositionCommand,
  buildGoCommand,
  buildSetOption,
  parseUCIMove,
  type UCISearchInfo,
  type UCIBestMove,
  type UCIOption,
} from './UCIProtocol';
import { mapEloToConfig, getAnalysisConfig, type EngineConfig } from './EloMapper';

// ─── Types ──────────────────────────────────────────────────────

export interface AnalysisLine {
  pvIndex: number;
  depth: number;
  score: { type: 'cp' | 'mate'; value: number };
  pv: string[];            // UCI moves
  nodes?: number;
  nps?: number;
}

export interface AnalysisResult {
  bestMove: string;         // UCI format e.g. "e2e4"
  ponder?: string;
  lines: AnalysisLine[];    // Multi-PV lines sorted by strength
  depth: number;
  evalScore: { type: 'cp' | 'mate'; value: number };
}

export interface PlayMoveResult {
  move: string;             // UCI format
  ponder?: string;
  wasRandomized: boolean;   // true if we substituted a random move for low-ELO play
}

type WorkerStatus = 'uninitialized' | 'loading' | 'ready' | 'busy' | 'error';

// ─── Stockfish Instance Wrapper ─────────────────────────────────

class StockfishInstance {
  private worker: Worker | null = null;
  private messageQueue: Array<(line: string) => void> = [];
  private _status: WorkerStatus = 'uninitialized';
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  get status(): WorkerStatus {
    return this._status;
  }

  /**
   * Initialize the Stockfish Web Worker and wait for UCI handshake.
   */
  async init(options: UCIOption[] = []): Promise<void> {
    this._status = 'loading';

    return new Promise<void>((resolve, reject) => {
      try {
        // Load the Stockfish WASM worker from public/
        this.worker = new Worker('/stockfish/stockfish-19-lite-single.js');

        this.worker.onerror = (err) => {
          console.error(`[${this.name}] Worker error:`, err);
          this._status = 'error';
          reject(err);
        };

        // Set up message handler
        this.worker.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === 'string' ? e.data : String(e.data);
          // Dispatch to all registered listeners
          for (const cb of this.messageQueue) {
            cb(line);
          }
        };

        // UCI initialization sequence
        this.waitForLine('uciok', 10000).then(async () => {
          // Apply UCI options
          for (const opt of options) {
            this.send(buildSetOption(opt.name, opt.value));
          }

          // Wait for engine to be ready
          this.send('isready');
          await this.waitForLine('readyok', 10000);

          this._status = 'ready';
          console.log(`[${this.name}] Stockfish initialized with ${options.length} options`);
          resolve();
        }).catch(reject);

        // Send UCI init command
        this.send('uci');
      } catch (err) {
        this._status = 'error';
        reject(err);
      }
    });
  }

  /**
   * Send a UCI command to the engine.
   */
  send(command: string): void {
    if (!this.worker) throw new Error(`[${this.name}] Worker not initialized`);
    this.worker.postMessage(command);
  }

  /**
   * Wait for a specific line from the engine output.
   */
  waitForLine(target: string, timeoutMs: number = 5000): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeListener(listener);
        reject(new Error(`[${this.name}] Timeout waiting for "${target}" after ${timeoutMs}ms`));
      }, timeoutMs);

      const listener = (line: string) => {
        if (line.startsWith(target) || line === target) {
          clearTimeout(timeout);
          this.removeListener(listener);
          resolve(line);
        }
      };

      this.addListener(listener);
    });
  }

  /**
   * Run analysis on a position. Returns when bestmove is received.
   * Also streams info lines to the callback for live updates.
   */
  async analyze(
    fen: string,
    goOptions: { depth?: number; movetime?: number; infinite?: boolean },
    onInfo?: (info: UCISearchInfo) => void,
  ): Promise<{ bestMove: UCIBestMove; lines: Map<number, UCISearchInfo> }> {
    if (this._status !== 'ready') {
      throw new Error(`[${this.name}] Engine not ready (status: ${this._status})`);
    }

    this._status = 'busy';

    // Stop any running search
    this.send('stop');
    // Small delay to let stop take effect
    await new Promise((r) => setTimeout(r, 10));

    // Set up the position
    this.send(buildPositionCommand(fen));

    // Collect info lines by multipv index
    const lines = new Map<number, UCISearchInfo>();

    return new Promise<{ bestMove: UCIBestMove; lines: Map<number, UCISearchInfo> }>((resolve) => {
      const listener = (rawLine: string) => {
        const info = parseInfoLine(rawLine);
        if (info) {
          const pvIndex = info.multipv || 1;
          // Only keep the deepest info per PV line
          const existing = lines.get(pvIndex);
          if (!existing || info.depth >= existing.depth) {
            lines.set(pvIndex, info);
          }
          onInfo?.(info);
        }

        const bestMove = parseBestMove(rawLine);
        if (bestMove) {
          this.removeListener(listener);
          this._status = 'ready';
          resolve({ bestMove, lines });
        }
      };

      this.addListener(listener);
      this.send(buildGoCommand(goOptions));
    });
  }

  /**
   * Reconfigure the engine with new UCI options (e.g., new skill level).
   */
  async reconfigure(options: UCIOption[]): Promise<void> {
    if (!this.worker) throw new Error(`[${this.name}] Worker not initialized`);

    this.send('stop');
    for (const opt of options) {
      this.send(buildSetOption(opt.name, opt.value));
    }
    this.send('isready');
    await this.waitForLine('readyok', 5000);
  }

  /**
   * Terminate the worker.
   */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.messageQueue = [];
    this._status = 'uninitialized';
  }

  private addListener(cb: (line: string) => void): void {
    this.messageQueue.push(cb);
  }

  private removeListener(cb: (line: string) => void): void {
    this.messageQueue = this.messageQueue.filter((l) => l !== cb);
  }
}

// ─── Stockfish Manager (Singleton) ──────────────────────────────

class StockfishManagerClass {
  private playEngine: StockfishInstance | null = null;
  private analysisEngine: StockfishInstance | null = null;
  private opponentEngine: StockfishInstance | null = null;

  private _initialized = false;
  private _initializing = false;
  private _currentRating = 1400;

  get initialized(): boolean {
    return this._initialized;
  }

  get currentRating(): number {
    return this._currentRating;
  }

  /**
   * Initialize all 3 Stockfish worker instances.
   */
  async init(rating: number = 1400): Promise<void> {
    if (this._initialized || this._initializing) return;
    this._initializing = true;

    console.log('[StockfishManager] Initializing 3 engine instances...');
    const start = performance.now();

    try {
      // Create instances
      this.playEngine = new StockfishInstance('PlayEngine');
      this.analysisEngine = new StockfishInstance('AnalysisEngine');
      this.opponentEngine = new StockfishInstance('OpponentPredictor');

      // Get configurations
      const playConfig = mapEloToConfig(rating);
      const analysisOptions = getAnalysisConfig(4); // 4 lines for multi-PV
      const opponentOptions = getAnalysisConfig(3); // 3 lines for opponent prediction

      // Initialize all 3 in parallel
      await Promise.all([
        this.playEngine.init(playConfig.uciOptions),
        this.analysisEngine.init(analysisOptions),
        this.opponentEngine.init(opponentOptions),
      ]);

      this._currentRating = rating;
      this._initialized = true;
      this._initializing = false;

      const elapsed = Math.round(performance.now() - start);
      console.log(`[StockfishManager] All engines ready in ${elapsed}ms`);
    } catch (err) {
      this._initializing = false;
      console.error('[StockfishManager] Initialization failed:', err);
      this.destroy();
      throw err;
    }
  }

  /**
   * Get the AI opponent's move for the current position.
   * Respects ELO rating limits and randomization for low-rated play.
   */
  async getAIMove(
    fen: string,
    allLegalMoves: string[],
  ): Promise<PlayMoveResult> {
    if (!this.playEngine) throw new Error('Play engine not initialized');

    const config = mapEloToConfig(this._currentRating);

    // Run engine analysis
    const { bestMove } = await this.playEngine.analyze(fen, {
      depth: config.searchDepth,
    });

    // Apply randomization for sub-1320 ELO simulation
    if (config.randomMoveProbability > 0 && Math.random() < config.randomMoveProbability) {
      // Pick a random legal move instead of the engine's best
      const randomMove = allLegalMoves[Math.floor(Math.random() * allLegalMoves.length)];
      return {
        move: randomMove,
        ponder: undefined,
        wasRandomized: true,
      };
    }

    return {
      move: bestMove.bestmove,
      ponder: bestMove.ponder,
      wasRandomized: false,
    };
  }

  /**
   * Full-strength position analysis with multiple PV lines.
   * Used for coaching and move suggestions.
   */
  async analyzePosition(
    fen: string,
    depth: number = 20,
    onProgress?: (info: UCISearchInfo) => void,
  ): Promise<AnalysisResult> {
    if (!this.analysisEngine) throw new Error('Analysis engine not initialized');

    const { bestMove, lines } = await this.analysisEngine.analyze(
      fen,
      { depth },
      onProgress,
    );

    // Convert info map to sorted AnalysisLine array
    const sortedLines: AnalysisLine[] = Array.from(lines.entries())
      .map(([pvIndex, info]) => ({
        pvIndex,
        depth: info.depth,
        score: info.score,
        pv: info.pv,
        nodes: info.nodes,
        nps: info.nps,
      }))
      .sort((a, b) => a.pvIndex - b.pvIndex);

    const bestLineInfo = sortedLines[0];

    return {
      bestMove: bestMove.bestmove,
      ponder: bestMove.ponder,
      lines: sortedLines,
      depth: bestLineInfo?.depth || depth,
      evalScore: bestLineInfo?.score || { type: 'cp', value: 0 },
    };
  }

  /**
   * Predict the opponent's best responses to a given position.
   * Used to populate the "Threat Matrix" panel.
   */
  async predictOpponentMoves(
    fen: string,
    depth: number = 16,
    onProgress?: (info: UCISearchInfo) => void,
  ): Promise<AnalysisResult> {
    if (!this.opponentEngine) throw new Error('Opponent engine not initialized');

    const { bestMove, lines } = await this.opponentEngine.analyze(
      fen,
      { depth },
      onProgress,
    );

    const sortedLines: AnalysisLine[] = Array.from(lines.entries())
      .map(([pvIndex, info]) => ({
        pvIndex,
        depth: info.depth,
        score: info.score,
        pv: info.pv,
        nodes: info.nodes,
        nps: info.nps,
      }))
      .sort((a, b) => a.pvIndex - b.pvIndex);

    const bestLineInfo = sortedLines[0];

    return {
      bestMove: bestMove.bestmove,
      ponder: bestMove.ponder,
      lines: sortedLines,
      depth: bestLineInfo?.depth || depth,
      evalScore: bestLineInfo?.score || { type: 'cp', value: 0 },
    };
  }

  /**
   * Change the AI opponent's playing strength.
   */
  async setRating(rating: number): Promise<void> {
    if (!this.playEngine) throw new Error('Play engine not initialized');

    const config = mapEloToConfig(rating);
    await this.playEngine.reconfigure(config.uciOptions);
    this._currentRating = rating;
    console.log(`[StockfishManager] Rating changed to ${rating} (${config.label})`);
  }

  /**
   * Get the status of all engines.
   */
  getStatus(): {
    playEngine: WorkerStatus;
    analysisEngine: WorkerStatus;
    opponentEngine: WorkerStatus;
  } {
    return {
      playEngine: this.playEngine?.status || 'uninitialized',
      analysisEngine: this.analysisEngine?.status || 'uninitialized',
      opponentEngine: this.opponentEngine?.status || 'uninitialized',
    };
  }

  /**
   * Terminate all worker instances.
   */
  destroy(): void {
    this.playEngine?.destroy();
    this.analysisEngine?.destroy();
    this.opponentEngine?.destroy();
    this.playEngine = null;
    this.analysisEngine = null;
    this.opponentEngine = null;
    this._initialized = false;
    this._initializing = false;
    console.log('[StockfishManager] All engines destroyed');
  }
}

/** Singleton instance */
export const StockfishManager = new StockfishManagerClass();

/** Re-export parseUCIMove for use in store */
export { parseUCIMove };
