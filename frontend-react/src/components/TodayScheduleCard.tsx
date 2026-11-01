import React from 'react';
import { Briefcase, Activity, BookOpen, BarChart3, Clock, Plus } from 'lucide-react';
import type { ScheduleItem } from '../types';

interface TodayScheduleCardProps {
  schedules: ScheduleItem[];
  onOpenModal: () => void;
  onToggleStatus: (uuid: string) => void;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  schedules,
  onOpenModal,
  onToggleStatus
}) => {
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'Pekerjaan':
        return {
          icon: Briefcase,
          iconBg: 'bg-blue-600/25 text-blue-400 border border-blue-500/40',
          badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
        };
      case 'Pribadi':
        return {
          icon: Activity,
          iconBg: 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/40',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        };
      case 'Belajar':
        return {
          icon: BookOpen,
          iconBg: 'bg-purple-600/25 text-purple-400 border border-purple-500/40',
          badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
        };
      case 'Kesehatan':
        return {
          icon: BarChart3,
          iconBg: 'bg-amber-600/25 text-amber-400 border border-amber-500/40',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        };
      default:
        return {
          icon: Clock,
          iconBg: 'bg-amber-600/25 text-amber-400 border border-amber-500/40',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        };
    }
  };

  return (
    <div className="glass-panel glass-panel-corner rounded-2xl p-5 flex flex-col justify-between h-full select-none">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#d4af37]/20">
          <div className="flex items-center space-x-2">
            <span className="text-base text-[#ffd700]">📜</span>
            <h3 className="font-cinzel text-sm font-bold text-slate-100 tracking-wide">
              Jadwal Hari Ini
            </h3>
          </div>
          <button
            onClick={onOpenModal}
            className="text-xs text-[#d4af37] hover:text-[#ffd700] transition-colors flex items-center space-x-1 group"
          >
            <span>Lihat Semua</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>

        {/* Schedule Items List */}
        <div className="mt-3.5 space-x-0 space-y-2.5">
          {schedules.slice(0, 4).map((item) => {
            const meta = getCategoryMeta(item.category);
            const IconComponent = meta.icon;
            const isDone = item.status === 'completed';

            return (
              <div
                key={item.uuid}
                onClick={() => onToggleStatus(item.uuid)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isDone
                    ? 'bg-white/[0.02] border-white/5 opacity-70'
                    : 'bg-[#0f172e]/60 border-[#d4af37]/20 hover:border-[#ffd700]/50 hover:bg-[#131d3b]/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Category Rounded Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div>
                    {/* Time Range */}
                    <div className="text-[11px] font-medium text-slate-400">
                      {item.startTime} – {item.endTime}
                    </div>
                    {/* Activity Title */}
                    <div
                      className={`text-xs font-semibold tracking-wide ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {item.title}
                    </div>
                  </div>
                </div>

                {/* Category Pill */}
                <div className="shrink-0">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-lg ${meta.badgeBg}`}>
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Add Schedule Link */}
      <button
        onClick={onOpenModal}
        className="mt-3 w-full py-2 rounded-xl border border-dashed border-[#d4af37]/30 text-xs text-[#d4af37]/80 hover:text-[#ffd700] hover:border-[#ffd700]/60 hover:bg-[#ffd700]/5 transition-all flex items-center justify-center space-x-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Tambah Kegiatan Hari Ini</span>
      </button>
    </div>
  );
};
