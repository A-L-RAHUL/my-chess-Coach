import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Bot, Terminal as TerminalIcon, Send, Sparkles } from 'lucide-react';

export const CoachPanel: React.FC = () => {
  const { history, lastMove, isCheck, isCheckmate, quadLens, turn } = useGameStore();
  const [messages, setMessages] = useState<Array<{ sender: 'coach' | 'user'; text: string; time: string }>>([
    {
      sender: 'coach',
      text: 'OmniChess AI Core online. I will analyze your decision tree, warn you of tactical plateau traps, and provide master insights. Make a move or ask for guidance below.',
      time: '00:01'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setInputVal('');

    // Generate local zero-cloud structured response
    setTimeout(() => {
      let coachReply = '';
      const lower = userMsg.toLowerCase();

      if (lower.includes('threat') || lower.includes('opponent')) {
        coachReply = `Opponent threat radar: ${quadLens.threatMatrix.threatSummary} Look out for forcing checks or counter-attacks.`;
      } else if (lower.includes('why') || lower.includes('best') || lower.includes('move')) {
        coachReply = `Master line recommendation: ${quadLens.masterVision.move?.san || 'N/A'}. Reason: ${quadLens.masterVision.move?.explanation}. This secures central control and tactical tempo.`;
      } else if (lower.includes('rating') || lower.includes('level')) {
        coachReply = `At ~1400 Elo, players often play ${quadLens.currentLevel.move?.san || 'instinctive moves'}. Notice how the Master line (${quadLens.masterVision.move?.san}) challenges deeper tactical weaknesses instead.`;
      } else {
        coachReply = `Analyzing current board state: ${history.length} ply recorded. Current best continuation is ${quadLens.masterVision.move?.san || 'calculating'}. Remember: verify all candidate checks, captures, and threats before executing.`;
      }

      setMessages((prev) => [...prev, { sender: 'coach', text: coachReply, time: now }]);
    }, 400);
  };

  return (
    <div className="glass-panel p-3 rounded-xl flex flex-col h-[280px]">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-200">
            LOCAL AI CHESS COACH (ZERO-CLOUD / OFFLINE)
          </span>
        </div>
        <span className="text-[10px] bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          QWEN-CHESS-COACH
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              m.sender === 'coach'
                ? 'bg-slate-900/90 border border-cyan-500/30 text-slate-200'
                : 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 ml-6'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-bold text-cyan-400">
                {m.sender === 'coach' ? '♟ COACH' : '> YOU'}
              </span>
              <span>{m.time}</span>
            </div>
            <p className="leading-relaxed font-sans text-xs">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask coach: 'Why this move?', 'What are opponent threats?', etc."
            className="w-full bg-black/60 border border-slate-700 focus:border-cyan-400 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-cyan-200 placeholder-slate-500 focus:outline-none"
          />
          <TerminalIcon className="absolute right-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
        </div>
        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-500 text-black px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};

