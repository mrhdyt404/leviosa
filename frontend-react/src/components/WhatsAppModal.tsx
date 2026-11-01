import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Phone, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification: (msg: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotification
}) => {
  const [phone, setPhone] = useState('081364393590');
  const [message, setMessage] = useState(
    `✨ *LEVIOSA NOTIFICATION TEST* ✨\n\nHalo dari Leviosa AI Personal Assistant!\nPengingat otomatis via Sidobe telah terhubung dengan jadwal produktivitas Anda.\n\n_"You don't need more time. You need a smarter way to live it."_`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    if (!phone.trim()) return;
    setIsLoading(true);
    setStatusResult(null);

    try {
      const res = await api.testWhatsApp(phone, message);
      setStatusResult({
        success: true,
        text: `Berhasil dikirim via Sidobe Cloud API! Status: ${res.status || 'PENDING'} (Antrean WhatsApp Aktif)`
      });
      onSuccessNotification(`WhatsApp reminder terkirim ke ${phone}`);
    } catch (err: any) {
      setStatusResult({
        success: false,
        text: `Gagal mengirim: ${err.message || 'Cek koneksi Sidobe API'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0e172e]/95 border border-[#25d366]/40 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(37,211,102,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#25d366]/25">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#25d366] text-white flex items-center justify-center shadow-[0_0_10px_#25d366]">
              <MessageSquare className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-cinzel text-sm font-bold text-slate-100 tracking-wide">
                WhatsApp Cloud API (Sidobe)
              </h3>
              <span className="text-[10px] text-emerald-400 font-medium">
                Resmi Terintegrasi • H-7, H-1, H-1 Jam, Hari H
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
        <div className="mt-4 space-y-3.5 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Kirimkan notifikasi uji coba langsung ke nomor WhatsApp Anda untuk memastikan gateway Sidobe siap mendistribusikan pengingat jadwal produktif.
          </p>

          {/* Phone Input */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Nomor WhatsApp Penerima
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0813... atau +628..."
                className="w-full bg-[#080d1e] border border-[#25d366]/40 rounded-xl pl-9 pr-3.5 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#25d366]"
              />
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Pesan Notifikasi</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#080d1e] border border-[#25d366]/40 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:border-[#25d366]"
            />
          </div>

          {/* Result Alert */}
          {statusResult && (
            <div
              className={`p-3 rounded-xl flex items-start space-x-2 border ${
                statusResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}
            >
              {statusResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              )}
              <span className="text-[11px] leading-relaxed">{statusResult.text}</span>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendTest}
            disabled={isLoading || !phone.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(37,211,102,0.35)] disabled:opacity-50 transition-all font-cinzel flex items-center justify-center space-x-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Mengirim via Sidobe...' : 'Kirim Pengingat Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
