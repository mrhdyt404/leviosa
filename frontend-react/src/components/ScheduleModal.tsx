import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ScheduleItem } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: ScheduleItem) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Pekerjaan' | 'Pribadi' | 'Belajar' | 'Kesehatan'>('Pekerjaan');
  const [priority, setPriority] = useState<'tinggi' | 'sedang' | 'rendah'>('sedang');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09.00');
  const [endTime, setEndTime] = useState('10.30');
  const [location, setLocation] = useState('Ruang Kerja / Zoom');
  const [notes, setNotes] = useState('');
  const [remH7, setRemH7] = useState(false);
  const [remH1, setRemH1] = useState(true);
  const [remH1h, setRemH1h] = useState(true);
  const [remHariH, setRemHariH] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const reminders: string[] = [];
    if (remH7) reminders.push('H-7');
    if (remH1) reminders.push('H-1');
    if (remH1h) reminders.push('H-1_jam');
    if (remHariH) reminders.push('hari_h');

    const newSchedule: ScheduleItem = {
      uuid: `sch-${Date.now()}`,
      title,
      category,
      priority,
      date,
      startTime,
      endTime,
      location,
      notes,
      status: 'pending',
      reminders
    };

    onSave(newSchedule);
    onClose();
    setTitle('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0e172e]/95 border border-[#d4af37]/50 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/25">
          <div className="flex items-center space-x-2">
            <span className="text-[#ffd700] text-lg">✦</span>
            <h3 className="font-cinzel text-base font-bold text-slate-100 tracking-wide">
              Atur Jadwal & Pengingat Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Nama Aktivitas / Kegiatan
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Meeting Proyek SIMOLI"
              className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#ffd700]"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#ffd700]"
              >
                <option value="Pekerjaan">💼 Pekerjaan</option>
                <option value="Pribadi">🏃 Pribadi</option>
                <option value="Belajar">📖 Belajar</option>
                <option value="Kesehatan">🧘 Kesehatan</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#ffd700]"
              >
                <option value="tinggi">🔴 Tinggi / Urgent</option>
                <option value="sedang">🟡 Sedang</option>
                <option value="rendah">🟢 Rendah</option>
              </select>
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#ffd700]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Lokasi</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ruang Meeting / Zoom"
                className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#ffd700]"
              />
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Waktu Mulai</label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09.00"
                className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#ffd700]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Waktu Selesai</label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="10.30"
                className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#ffd700]"
              />
            </div>
          </div>

          {/* Automatic Sidobe WhatsApp Reminder Checkboxes */}
          <div>
            <label className="block text-[#ffd700] font-semibold mb-1.5 flex items-center space-x-1.5">
              <span>📱</span>
              <span>Pengingat WhatsApp Otomatis (Sidobe Cloud API)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <label className={`flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all ${
                remH7 ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#ffd700]' : 'bg-[#080d1e] border-[#d4af37]/20 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={remH7}
                  onChange={(e) => setRemH7(e.target.checked)}
                  className="hidden"
                />
                <span className="font-semibold text-[11px]">H-7</span>
              </label>

              <label className={`flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all ${
                remH1 ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#ffd700]' : 'bg-[#080d1e] border-[#d4af37]/20 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={remH1}
                  onChange={(e) => setRemH1(e.target.checked)}
                  className="hidden"
                />
                <span className="font-semibold text-[11px]">H-1</span>
              </label>

              <label className={`flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all ${
                remH1h ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#ffd700]' : 'bg-[#080d1e] border-[#d4af37]/20 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={remH1h}
                  onChange={(e) => setRemH1h(e.target.checked)}
                  className="hidden"
                />
                <span className="font-semibold text-[11px]">H-1 Jam</span>
              </label>

              <label className={`flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all ${
                remHariH ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#ffd700]' : 'bg-[#080d1e] border-[#d4af37]/20 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={remHariH}
                  onChange={(e) => setRemHariH(e.target.checked)}
                  className="hidden"
                />
                <span className="font-semibold text-[11px]">Hari H</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Catatan Persiapan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Persiapkan poin-poin materi dan buffer waktu..."
              className="w-full bg-[#080d1e] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#ffd700]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f5c542] to-[#d4af37] text-[#0a0f20] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:brightness-110 transition-all font-cinzel mt-2"
          >
            Simpan Jadwal & Pasang Pengingat
          </button>
        </form>
      </div>
    </div>
  );
};
