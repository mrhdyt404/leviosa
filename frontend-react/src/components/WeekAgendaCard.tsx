import React, { useState } from 'react';

interface DayItem {
  dayName: string;
  dateNum: number;
  dots?: string[];
}

export const WeekAgendaCard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(10);

  const days: DayItem[] = [
    { dayName: 'Sen', dateNum: 10, dots: ['#ffd700', '#f97316'] },
    { dayName: 'Sel', dateNum: 11, dots: ['#a855f7', '#10b981'] },
    { dayName: 'Rab', dateNum: 12, dots: ['#3b82f6', '#a855f7'] },
    { dayName: 'Kam', dateNum: 13, dots: ['#64748b'] },
    { dayName: 'Jum', dateNum: 14, dots: [] },
    { dayName: 'Sab', dateNum: 15, dots: [] },
    { dayName: 'Min', dateNum: 16, dots: [] }
  ];

  return (
    <div className="glass-panel glass-panel-corner rounded-2xl p-5 flex flex-col justify-between h-full select-none relative overflow-hidden">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#d4af37]/20">
          <div className="flex items-center space-x-2">
            <span className="text-base text-[#ffd700]">📖</span>
            <h3 className="font-cinzel text-sm font-bold text-slate-100 tracking-wide">
              Agenda Minggu Ini
            </h3>
          </div>
          <button
            onClick={() => alert('Jadwal minggu ini: 18 jam alokasi fokus.')}
            className="text-xs text-[#d4af37] hover:text-[#ffd700] transition-colors flex items-center space-x-1 group"
          >
            <span>Lihat Detail</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>

        {/* Horizontal Week Strip */}
        <div className="grid grid-cols-7 gap-2 mt-4 text-center">
          {days.map((item) => {
            const isSelected = selectedDate === item.dateNum;
            return (
              <button
                key={item.dateNum}
                onClick={() => setSelectedDate(item.dateNum)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                  {item.dayName}
                </span>

                <div
                  className={`mt-1.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#8c6d1f] via-[#ffd700] to-[#fff0b3] text-[#0a0f20] shadow-[0_0_14px_#ffd700] scale-105 font-bold'
                      : 'text-slate-300 hover:bg-white/[0.06] border border-transparent hover:border-[#d4af37]/30'
                  }`}
                >
                  {item.dateNum}
                </div>

                {/* Status Indicator Dots */}
                <div className="flex items-center space-x-1 mt-1.5 h-1.5">
                  {item.dots?.map((c, i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Spellbook Illustration with Magical Light Arc */}
      <div className="relative mt-2 h-36 flex items-center justify-center">
        {/* Glow behind book */}
        <div className="absolute w-44 h-24 bg-yellow-400/15 rounded-full blur-2xl animate-magic-pulse" />

        <svg
          className="w-full max-w-[280px] h-32 overflow-visible drop-shadow-[0_0_16px_rgba(255,215,0,0.4)]"
          viewBox="0 0 240 140"
          fill="none"
        >
          {/* Swirling Arc of Golden Stardust Stream */}
          <path
            d="M20 110 C 60 40, 110 90, 160 50 C 190 30, 220 20, 235 15"
            stroke="url(#arcStreamGold)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.85"
            className="animate-pulse"
          />
          <path
            d="M35 115 C 75 55, 120 95, 170 55 C 200 35, 225 25, 238 20"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Floating Stars along the arc */}
          <circle cx="65" cy="62" r="2.5" fill="#ffd700" filter="url(#glowStar)" />
          <circle cx="115" cy="85" r="2" fill="#fff" filter="url(#glowStar)" />
          <circle cx="170" cy="50" r="3" fill="#ffd700" filter="url(#glowStar)" />
          <circle cx="210" cy="28" r="2.5" fill="#fff" filter="url(#glowStar)" />
          <circle cx="230" cy="18" r="2" fill="#ffd700" />

          {/* Open Leather Spellbook Base */}
          <g className="animate-book-float" style={{ transformOrigin: '120px 85px' }}>
            {/* Left Cover Leather */}
            <path
              d="M120 96 C 85 94, 38 82, 22 68 C 34 56, 86 68, 120 76 Z"
              fill="#fff8ea"
              stroke="#d4af37"
              strokeWidth="1.5"
            />
            {/* Left Pages Deck */}
            <path
              d="M120 98 C 87 96, 40 84, 25 70 C 36 59, 88 70, 120 78 Z"
              fill="#fef4df"
              opacity="0.9"
            />

            {/* Right Cover Leather */}
            <path
              d="M120 96 C 155 94, 202 82, 218 68 C 206 56, 154 68, 120 76 Z"
              fill="#fff8ea"
              stroke="#d4af37"
              strokeWidth="1.5"
            />
            {/* Right Pages Deck */}
            <path
              d="M120 98 C 153 96, 200 84, 215 70 C 204 59, 152 70, 120 78 Z"
              fill="#fef4df"
              opacity="0.9"
            />

            {/* Spine */}
            <ellipse cx="120" cy="96" rx="4.5" ry="14" fill="#541e12" stroke="#d4af37" strokeWidth="0.8" />

            {/* Gold Page Lines / Ancient Runes */}
            <path d="M48 70 Q 75 74 105 80" stroke="#b8860b" strokeWidth="1" opacity="0.6" />
            <path d="M52 76 Q 78 80 105 86" stroke="#b8860b" strokeWidth="1" opacity="0.6" />
            <path d="M135 80 Q 165 74 192 70" stroke="#b8860b" strokeWidth="1" opacity="0.6" />
            <path d="M135 86 Q 162 80 188 76" stroke="#b8860b" strokeWidth="1" opacity="0.6" />
          </g>

          <defs>
            <linearGradient id="arcStreamGold" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fff8db" />
              <stop offset="40%" stopColor="#ffd700" />
              <stop offset="80%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#ffeed1" />
            </linearGradient>
            <filter id="glowStar" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
};
