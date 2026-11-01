import React from 'react';
import { Check, Clock, Star } from 'lucide-react';
import type { ProductivityStats } from '../types';

interface ProductivityCardProps {
  stats: ProductivityStats;
  onViewReport: () => void;
}

export const ProductivityCard: React.FC<ProductivityCardProps> = ({
  stats,
  onViewReport
}) => {
  // SVG Circular Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="glass-panel glass-panel-corner rounded-2xl p-5 flex flex-col justify-between h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#d4af37]/20">
        <div className="flex items-center space-x-2">
          <span className="text-base text-[#ffd700]">📊</span>
          <h3 className="font-cinzel text-sm font-bold text-slate-100 tracking-wide">
            Ringkasan Produktivitas
          </h3>
        </div>
        <button
          onClick={onViewReport}
          className="text-xs text-[#d4af37] hover:text-[#ffd700] transition-colors flex items-center space-x-1 group"
        >
          <span>Lihat Laporan</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>

      {/* Body: Circular Gauge + Metrics */}
      <div className="flex items-center justify-around py-3">
        {/* SVG Circular Progress Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-[#0d162d] stroke-current"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Animated Gradient Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#productivityGaugeGradient)"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="productivityGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-cinzel text-slate-100 tracking-tight leading-none">
              {stats.completionRate}%
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
              Target Mingguan
            </span>
          </div>
        </div>

        {/* Metrics List */}
        <div className="space-y-3.5 pl-3">
          {/* Completed Tasks */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 leading-tight">
                {stats.completedTasks} / {stats.totalTasks}
              </div>
              <div className="text-[10px] text-slate-400">Tugas Selesai</div>
            </div>
          </div>

          {/* Productive Hours */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 leading-tight">
                {stats.productiveHours} jam
              </div>
              <div className="text-[10px] text-slate-400">Waktu Produktif</div>
            </div>
          </div>

          {/* Consistency Score */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-[#ffd700] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(255,215,0,0.3)]">
              <Star className="w-4 h-4 fill-[#ffd700]" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 leading-tight">
                {stats.consistencyScore} / 100
              </div>
              <div className="text-[10px] text-slate-400">Konsistensi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
