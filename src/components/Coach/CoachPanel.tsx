import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngineStore } from '../../store/engineStore';
import { Bot, Send, Sparkles, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  time: string;
}

export const CoachPanel: React.FC = () => {
  const { history, lastMove, isCheck, isCheckmate, turn } = useGameStore();
  const { currentAnalysis, opponentPrediction, targetRating, isAnalyzing } = useEngineStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      sender: 'coach',
      text: 'Welcome! I\'m your AI chess coach. Make a move and I\'ll analyze it — or ask me anything about the position. I use Stockfish engine data to give you accurate, hallucination-free advice.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-coaching: add analysis after each move
  useEffect(() => {
    if (!currentAnalysis || history.length === 0) return;

    const eval_ = currentAnalysis.evalScore;
    const evalText = eval_.type === 'mate'
      ? (eval_.value > 0 ? `Mate in ${eval_.value}` : `Getting mated in ${Math.abs(eval_.value)}`)
      : `${eval_.value >= 0 ? '+' : ''}${(eval_.value / 100).toFixed(2)}`;

    const bestMove = currentAnalysis.bestMoveUCI || '—';
    const depth = currentAnalysis.depth;

    let insight = '';
    if (Math.abs(eval_.type === 'cp' ? eval_.value : 0) < 30) {
      insight = 'Position is roughly equal. Focus on improving piece activity and controlling key squares.';
    } else if ((eval_.type === 'cp' && eval_.value > 100) || (eval_.type === 'mate' && eval_.value > 0)) {
      insight = 'White has a significant advantage. Look for tactical opportunities to convert.';
    } else if ((eval_.type === 'cp' && eval_.value < -100) || (eval_.type === 'mate' && eval_.value < 0)) {
      insight = 'Black has a significant advantage. Focus on defense and creating counterplay.';
    } else {
      insight = 'Slight edge detected. Maintain pressure and avoid unnecessary exchanges.';
    }

    const coachMsg: Message = {
      id: `auto-${history.length}`,
      sender: 'coach',
      text: `📊 Position eval: ${evalText} (depth ${depth}). Engine recommends: ${bestMove}. ${insight}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => {
      // Avoid duplicate auto-messages
      if (prev.some((m) => m.id === coachMsg.id)) return prev;
      return [...prev, coachMsg];
    });
  }, [currentAnalysis, history.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `user-${Date.now()}`;

    setMessages((prev) => [...prev, { id: msgId, sender: 'user', text: userMsg, time: now }]);
    setInputVal('');

    // Generate coach response based on engine data
    setTimeout(() => {
      let reply = '';
      const lower = userMsg.toLowerCase();

      if (lower.includes('best') || lower.includes('move') || lower.includes('suggest')) {
        const best = currentAnalysis?.bestMoveUCI || 'calculating...';
        const eval_ = currentAnalysis?.evalScore;
        const evalStr = eval_ ? `${(eval_.value / 100).toFixed(2)}` : '—';
        reply = `The engine's top recommendation is ${best} (eval: ${evalStr}). This move maintains the best balance of attack and defense in the current position.`;
      } else if (lower.includes('threat') || lower.includes('opponent') || lower.includes('danger')) {
        const threats = opponentPrediction?.lines || [];
        if (threats.length > 0) {
          reply = `⚠️ Watch out! Your opponent's strongest continuation is ${threats[0].pvUCI[0]}. ${threats.length > 1 ? `They could also try ${threats[1].pvUCI[0]}.` : ''} Stay alert for tactical shots.`;
        } else {
          reply = 'No immediate threats detected. The position looks stable.';
        }
      } else if (lower.includes('rating') || lower.includes('level') || lower.includes('strength')) {
        reply = `Currently playing against ~${targetRating} ELO. At this level, focus on ${
          targetRating < 1200 ? 'basic tactics and not hanging pieces' :
          targetRating < 1600 ? 'central control and piece development' :
          targetRating < 2000 ? 'strategic planning and accurate calculation' :
          'deep positional understanding and endgame technique'
        }.`;
      } else if (lower.includes('plan') || lower.includes('strategy') || lower.includes('idea')) {
        reply = `In this position, the key strategic themes are: 1) Control the center, 2) Develop pieces to active squares, 3) Ensure king safety. The engine line gives us the concrete best continuation.`;
      } else {
        const eval_ = currentAnalysis?.evalScore;
        const evalStr = eval_ ? `${eval_.value >= 0 ? '+' : ''}${(eval_.value / 100).toFixed(2)}` : '—';
        reply = `Current position evaluation: ${evalStr}. ${history.length} moves played. Best continuation: ${currentAnalysis?.bestMoveUCI || 'analyzing...'}. What specific aspect would you like me to explain?`;
      }

      setMessages((prev) => [...prev, {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: reply,
        time: now,
      }]);
    }, 300);
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            AI Coach
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/70 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full">
          <Cpu className="w-3 h-3" />
          <span>Stockfish-powered</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                m.sender === 'coach'
                  ? 'bg-white/[0.03] border border-white/[0.06] text-zinc-300'
                  : 'bg-cyan-500/[0.08] border border-cyan-500/20 text-cyan-100 ml-4'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span className={`font-bold ${m.sender === 'coach' ? 'text-cyan-400/80' : 'text-cyan-300'}`}>
                  {m.sender === 'coach' ? '♟ Coach' : 'You'}
                </span>
                <span>{m.time}</span>
              </div>
              <p>{m.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-[10px] text-cyan-400/60 font-mono px-1">
            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            Analyzing position...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 px-3 py-2.5 border-t border-white/[0.04]">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask: 'What's the best move?', 'Any threats?'"
          className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
