import { Chess } from 'chess.js';
import { TacticalAlert, MoveAnalysis, MoveClassification, QuadLensState } from '../types/chess';

export interface EvaluatedMove {
  san: string;
  from: string;
  to: string;
  scoreCp: number;
  explanation: string;
  category: MoveClassification;
}

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export function evaluatePositionTactics(chess: Chess): TacticalAlert[] {
  const alerts: TacticalAlert[] = [];
  const board = chess.board();
  const turn = chess.turn();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const square = `${String.fromCharCode(97 + c)}${8 - r}`;
      if (piece.type === 'k' && piece.color === turn && chess.inCheck()) {
        alerts.push({
          type: 'check',
          square,
          description: 'King under direct fire. Forcing response mandatory.'
        });
      }
    }
  }

  return alerts;
}

export function simulateMultiLens(fen: string, userProposedMove?: string): QuadLensState {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  const turn = chess.turn();

  if (moves.length === 0) {
    return {
      currentLevel: { move: undefined, targetRating: 1200, insight: 'No legal moves available.', loading: false },
      masterVision: { move: undefined, depth: 22, lines: [], evalScore: 0, loading: false },
      threatMatrix: { opponentTopThreats: [], hangingSquares: [], kingDangerScore: 0, threatSummary: 'Position quiescent.', loading: false },
      userIdea: { loading: false }
    };
  }

  const scoredMoves: EvaluatedMove[] = moves.map((m) => {
    let score = 0;
    let explanation = 'Positional maneuvering';
    let category: MoveClassification = 'good';

    if (m.captured) {
      const gain = (PIECE_VALUES[m.captured] || 0) - (PIECE_VALUES[m.piece] || 0);
      score += (PIECE_VALUES[m.captured] || 0) * 1.5;
      explanation = `Tactical liquidation: capture ${m.captured.toUpperCase()} on ${m.to}`;
      if (gain >= 200) category = 'best';
    }

    if (['e4', 'd4', 'e5', 'd5'].includes(m.to)) {
      score += 45;
      explanation = `Direct central domain contestation on ${m.to}`;
    }

    if (['n', 'b'].includes(m.piece) && (m.from.endsWith('1') || m.from.endsWith('8'))) {
      score += 35;
      explanation = `Harmonious piece activation preparing tactical coordination`;
    }

    const clone = new Chess(fen);
    try {
      const res = clone.move(m.san);
      if (res && clone.inCheck()) {
        score += 85;
        explanation = `Forcing check disrupting opponent tempo`;
        category = 'best';
      }
    } catch {
      // Ignore
    }

    const cp = turn === 'w' ? score : -score;

    return {
      san: m.san,
      from: m.from,
      to: m.to,
      scoreCp: cp,
      explanation,
      category,
    };
  });

  scoredMoves.sort((a, b) => (turn === 'w' ? b.scoreCp - a.scoreCp : a.scoreCp - b.scoreCp));

  const best = scoredMoves[0];
  const second = scoredMoves[1] || best;

  const oppChess = new Chess(fen);
  oppChess.move(best.san);
  const oppMoves = oppChess.moves({ verbose: true });
  const oppThreats: EvaluatedMove[] = oppMoves.map((om) => ({
    san: om.san,
    from: om.from,
    to: om.to,
    scoreCp: om.captured ? 150 : 20,
    explanation: om.captured ? `Counter-attack capturing ${om.captured.toUpperCase()}` : `Defensive repositioning`,
    category: 'good' as MoveClassification
  })).slice(0, 3);

  let userIdeaAnalysis = undefined;
  if (userProposedMove) {
    const userMoveObj = scoredMoves.find((m) => m.san === userProposedMove || `${m.from}${m.to}` === userProposedMove);
    if (userMoveObj) {
      const evalDiff = Math.abs(best.scoreCp - userMoveObj.scoreCp);
      let verdict = 'Sound idea';
      let refutation = 'No immediate tactical drawbacks identified.';

      if (evalDiff > 150) {
        verdict = 'Tactical inaccuracy / drops initiative';
        refutation = `Allows opponent rapid counter-play. Master vision preferred ${best.san} (+${(evalDiff/100).toFixed(2)} advantage).`;
      }

      userIdeaAnalysis = {
        candidateMove: userMoveObj.san,
        analysis: {
          san: userMoveObj.san,
          from: userMoveObj.from,
          to: userMoveObj.to,
          evalCp: userMoveObj.scoreCp,
          depth: 18,
          pv: [userMoveObj.san],
          classification: userMoveObj.category,
          explanation: userMoveObj.explanation,
        },
        refutation,
        verdict,
        evalDifference: evalDiff,
        loading: false,
      };
    }
  }

  const currentMoveAnalysis: MoveAnalysis = {
    san: second.san,
    from: second.from,
    to: second.to,
    evalCp: second.scoreCp,
    depth: 12,
    pv: [second.san],
    classification: second.category,
    explanation: second.explanation,
    difficulty: 2
  };

  const masterMoveAnalysis: MoveAnalysis = {
    san: best.san,
    from: best.from,
    to: best.to,
    evalCp: best.scoreCp,
    depth: 22,
    pv: [best.san, ...(oppThreats[0] ? [oppThreats[0].san] : [])],
    classification: 'best',
    explanation: best.explanation,
    difficulty: 5
  };

  const masterLines: MoveAnalysis[] = scoredMoves.slice(0, 4).map((m) => ({
    san: m.san,
    from: m.from,
    to: m.to,
    evalCp: m.scoreCp,
    depth: 22,
    pv: [m.san],
    classification: m.category,
    explanation: m.explanation,
  }));

  const opponentThreats: MoveAnalysis[] = oppThreats.map((ot) => ({
    san: ot.san,
    from: ot.from,
    to: ot.to,
    evalCp: ot.scoreCp,
    depth: 16,
    pv: [ot.san],
    explanation: ot.explanation,
  }));

  return {
    currentLevel: {
      move: currentMoveAnalysis,
      targetRating: 1400,
      insight: `Club-level standard move: prioritizes direct threats and basic development.`,
      loading: false
    },
    masterVision: {
      move: masterMoveAnalysis,
      depth: 22,
      lines: masterLines,
      evalScore: best.scoreCp,
      loading: false
    },
    threatMatrix: {
      opponentTopThreats: opponentThreats,
      hangingSquares: [],
      kingDangerScore: oppChess.inCheck() ? 92 : 24,
      threatSummary: opponentThreats.length > 0 ? `Anticipating ${opponentThreats[0].san} targeting key sectors.` : 'Opponent defenses subdued.',
      loading: false
    },
    userIdea: userIdeaAnalysis || { loading: false }
  };
}

