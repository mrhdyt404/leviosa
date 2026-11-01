import React from 'react';
import { X, Calendar, Flag } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const holidays = [
    { date: '1 Jan 2026', name: 'Tahun Baru 2026 Masehi', type: 'Nasional' },
    { date: '16 Jan 2026', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'Keagamaan' },
    { date: '17 Feb 2026', name: 'Tahun Baru Imlek 2577 Kongzili', type: 'Nasional' },
    { date: '19-20 Mar 2026', name: 'Hari Suci Nyepi & Cuti Bersama', type: 'Nasional' },
    { date: '21-22 Mar 2026', name: 'Hari Raya Idul Fitri 1447 H', type: 'Keagamaan' },
    { date: '3 Apr 2026', name: 'Wafat Yesus Kristus', type: 'Keagamaan' },
    { date: '1 Mei 2026', name: 'Hari Buruh Internasional', type: 'Nasional' },
    { date: '14 Mei 2026', name: 'Kenaikan Yesus Kristus', type: 'Keagamaan' },
    { date: '31 Mei 2026', name: 'Hari Raya Waisak 2570 BE', type: 'Keagamaan' },
    { date: '1 Jun 2026', name: 'Hari Lahir Pancasila', type: 'Nasional' },
    { date: '17 Agu 2026', name: 'Hari Kemerdekaan RI Ke-81', type: 'Nasional' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0e172e]/95 border border-[#d4af37]/50 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/25">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ffd700]/20 text-[#ffd700] flex items-center justify-center border border-[#ffd700]/40">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinzel text-sm font-bold text-slate-100 tracking-wide">
                Kalender Aktif & Hari Libur Indonesia
              </h3>
              <span className="text-[10px] text-[#d4af37]">
                Sinkronisasi Realtime 2026 / 1447 H
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
          {holidays.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#090f20] border border-[#d4af37]/20 hover:border-[#ffd700]/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Flag className="w-4 h-4 text-[#ffd700]" />
                <div>
                  <div className="font-semibold text-slate-100">{h.name}</div>
                  <div className="text-[10px] text-slate-400">{h.date}</div>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                {h.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
