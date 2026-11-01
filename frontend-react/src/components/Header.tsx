import { useState } from 'react';
import { Search, Bell, Sun, CloudSun } from 'lucide-react';
import type { TodayCalendarResponse, WeatherResponse } from '../services/api';

interface HeaderProps {
  todayInfo: TodayCalendarResponse | null;
  weather: WeatherResponse | null;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  onSearch: (q: string) => void;
}

export const Header = ({
  todayInfo,
  weather,
  onToggleTheme,
  onOpenNotifications,
  onSearch
}: HeaderProps) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const dayDateStr = todayInfo
    ? `${todayInfo.day_name_id}, ${todayInfo.date}`
    : 'Senin, 10 Nov 2026';
  const hijriahStr = todayInfo?.hijriah || '15 Jumadil Awal 1447 H';
  const tempStr = weather ? `${weather.temperature}°C` : '28°C';
  const conditionStr = weather?.condition || 'Partly Cloudy';

  return (
    <header className="w-full flex items-center justify-between pb-6 select-none">
      {/* Left: User Greeting Pill */}
      <div className="flex items-center space-x-4">
        {/* Harry Potter Style Portrait Avatar */}
        <div className="relative group cursor-pointer">
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#ffd700] via-[#fff0b3] to-[#8c6d1f] shadow-[0_0_16px_rgba(255,215,0,0.4)]">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=160&auto=format&fit=crop&q=80"
              alt="Arkana Pratama"
              className="w-full h-full object-cover rounded-full filter contrast-105"
            />
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#060913] shadow-[0_0_8px_#10b981]" />
        </div>

        {/* Greeting Text */}
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="font-cinzel text-base text-slate-300">Good Morning,</span>
            <h2 className="font-cinzel text-xl font-bold gold-gradient-text tracking-wide">
              Arkana Pratama!
            </h2>
          </div>
          <p className="font-parchment text-xs text-[#d4af37]/80 italic mt-0.5 tracking-wide">
            "Dream big, plan well, and let Leviosa lift the rest."
          </p>
        </div>
      </div>

      {/* Right: Actions, Search & Live Widgets */}
      <div className="flex items-center space-x-3.5">
        {/* Search Bar */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search anything... (⌘ + K)"
            className="w-full bg-[#0c1224]/70 border border-[#d4af37]/30 rounded-xl pl-10 pr-12 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/50 transition-all shadow-inner"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-[#1a233d] text-slate-300 px-1.5 py-0.5 rounded border border-white/10 font-mono">
            ⌘ K
          </span>
        </div>

        {/* Weather Pill */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#0e162d]/70 border border-[#d4af37]/25 backdrop-blur-md shadow-sm">
          <CloudSun className="w-5 h-5 text-[#ffd700]" />
          <div className="text-left leading-tight">
            <div className="text-xs font-semibold text-slate-100 flex items-center space-x-1">
              <span>Jakarta</span>
              <span className="text-[#ffd700]">{tempStr}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {conditionStr} • H:32° L:24°
            </div>
          </div>
        </div>

        {/* Date Widget */}
        <div className="px-3.5 py-1.5 rounded-xl bg-[#0e162d]/70 border border-[#d4af37]/25 backdrop-blur-md text-right leading-tight shadow-sm">
          <div className="text-xs font-semibold text-[#fff0b3] font-cinzel">
            {dayDateStr}
          </div>
          <div className="text-[10px] text-[#d4af37]/75 font-parchment">
            {hijriahStr}
          </div>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-[#0e162d]/70 border border-[#d4af37]/25 hover:border-[#ffd700] text-slate-300 hover:text-[#ffd700] transition-colors shadow-sm"
          title="Notifikasi Pengingat"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)]">
            3
          </span>
        </button>

        {/* Theme Toggle (Hogwarts Night / Winter Magic) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-[#0e162d]/70 border border-[#d4af37]/25 hover:border-[#ffd700] text-[#ffd700] transition-colors shadow-sm"
          title="Ganti Suasana (Malam / Musim Dingin)"
        >
          <Sun className="w-4 h-4 animate-spin-slow" />
        </button>
      </div>
    </header>
  );
};
