import React from 'react';
import { Plus, Calendar, BarChart2, Settings } from 'lucide-react';

interface BottomActionBarProps {
  onAddSchedule: () => void;
  onAddTask: () => void;
  onViewCalendar: () => void;
  onViewStats: () => void;
  onOpenSettings: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onAddSchedule,
  onAddTask,
  onViewCalendar,
  onViewStats,
  onOpenSettings
}) => {
  return (
    <div className="w-full flex items-center justify-between space-x-3 pt-5 select-none">
      {/* 1. Tambah Jadwal */}
      <button
        onClick={onAddSchedule}
        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffd700]/15 via-[#ffd700]/10 to-[#b8860b]/15 hover:from-[#ffd700]/25 hover:to-[#ffd700]/20 border border-[#ffd700]/40 hover:border-[#ffd700] text-xs font-semibold text-[#ffd700] flex items-center justify-center space-x-2 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] group"
      >
        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
        <span className="font-cinzel tracking-wider">Tambah Jadwal</span>
      </button>

      {/* 2. Tambah Tugas */}
      <button
        onClick={onAddTask}
        className="flex-1 py-2.5 px-4 rounded-xl bg-[#0f172e]/70 hover:bg-[#131d3b] border border-[#d4af37]/30 hover:border-[#ffd700]/70 text-xs font-semibold text-slate-200 hover:text-[#ffd700] flex items-center justify-center space-x-2 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] group"
      >
        <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
        <span className="font-cinzel tracking-wider">Tambah Tugas</span>
      </button>

      {/* 3. Lihat Kalender */}
      <button
        onClick={onViewCalendar}
        className="flex-1 py-2.5 px-4 rounded-xl bg-[#0f172e]/70 hover:bg-[#131d3b] border border-[#d4af37]/30 hover:border-[#ffd700]/70 text-xs font-semibold text-slate-200 hover:text-[#ffd700] flex items-center justify-center space-x-2 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] group"
      >
        <Calendar className="w-4 h-4 text-[#d4af37] group-hover:text-[#ffd700]" />
        <span className="font-cinzel tracking-wider">Lihat Kalender</span>
      </button>

      {/* 4. Statistik */}
      <button
        onClick={onViewStats}
        className="flex-1 py-2.5 px-4 rounded-xl bg-[#0f172e]/70 hover:bg-[#131d3b] border border-[#d4af37]/30 hover:border-[#ffd700]/70 text-xs font-semibold text-slate-200 hover:text-[#ffd700] flex items-center justify-center space-x-2 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] group"
      >
        <BarChart2 className="w-4 h-4 text-[#d4af37] group-hover:text-[#ffd700]" />
        <span className="font-cinzel tracking-wider">Statistik</span>
      </button>

      {/* 5. Pengaturan & WhatsApp */}
      <button
        onClick={onOpenSettings}
        className="flex-1 py-2.5 px-4 rounded-xl bg-[#0f172e]/70 hover:bg-[#131d3b] border border-[#d4af37]/30 hover:border-[#ffd700]/70 text-xs font-semibold text-slate-200 hover:text-[#ffd700] flex items-center justify-center space-x-2 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] group"
      >
        <Settings className="w-4 h-4 text-[#d4af37] group-hover:rotate-45 transition-transform duration-300" />
        <span className="font-cinzel tracking-wider">Pengaturan</span>
      </button>
    </div>
  );
};
