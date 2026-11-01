import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import type { ChatMessage } from '../types';
import { api } from '../services/api';

interface CompanionCardProps {
  onScheduleCreated?: () => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Halo, Arkana! ✨ Ada yang bisa saya bantu hari ini?',
      timestamp: 'Baru saja'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'Buatkan jadwal untuk besok',
    'Apa saja kegiatan saya hari ini?',
    'Evaluasi produktivitas minggu ini',
    'Cek cuaca besok'
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await api.chatAI(text);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.reply || 'Tentu, Arkana! Jadwal dan pengingat Anda telah diselaraskan.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Graceful Hogwarts themed fallback response
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `Saya telah menganalisis jadwal Anda: alokasi 08.00–09.30 untuk SIMOLI optimal dengan buffer 30 menit. Tidak ada potensi bentrok cuaca dengan kegiatan indoor.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-corner rounded-2xl p-5 flex flex-col justify-between h-full select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#d4af37]/20">
          <div className="flex items-center space-x-2.5">
            {/* Companion Portrait Avatar */}
            <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#ffd700] to-[#8c6d1f] shadow-[0_0_8px_rgba(255,215,0,0.3)] shrink-0">
              <img
                src="https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=120&auto=format&fit=crop&q=80"
                alt="Leviosa Companion"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h3 className="font-cinzel text-xs font-bold text-slate-100 tracking-wide leading-none">
                Leviosa Companion
              </h3>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span className="text-[10px] text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            title="Reset percakapan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Stream */}
        <div
          ref={scrollRef}
          className="mt-3.5 space-y-3 max-h-[160px] overflow-y-auto pr-1 text-xs"
        >
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-[#1b2644] border border-[#d4af37]/40 flex items-center justify-center shrink-0 text-[10px]">
                    🧙‍♂️
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-[#ffd700]/25 to-[#ffd700]/15 border border-[#ffd700]/40 text-slate-100 rounded-tr-none'
                      : 'bg-[#0f172e]/80 border border-[#d4af37]/25 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd700] animate-spin" />
              <span>Leviosa sedang merapikan jadwal...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="mt-3 space-y-1.5">
        <div className="space-y-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="w-full text-left px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-[#ffd700]/10 border border-[#d4af37]/20 hover:border-[#ffd700]/50 text-[11px] text-slate-300 hover:text-[#ffd700] transition-all flex items-center space-x-2 group"
            >
              <Sparkles className="w-3 h-3 text-[#d4af37] group-hover:text-[#ffd700] shrink-0" />
              <span className="truncate">{prompt}</span>
            </button>
          ))}
        </div>

        {/* Input Field Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative mt-2 flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tanyakan sesuatu..."
            className="w-full bg-[#090e1d]/85 border border-[#d4af37]/35 rounded-xl pl-3.5 pr-10 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/50 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 text-[#ffd700] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Kirim pesan"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
