import React from 'react';
import { MessageSquare, X } from 'lucide-react';

interface WhatsAppToastProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  timeAgo?: string;
  message?: string;
}

export const WhatsAppToast: React.FC<WhatsAppToastProps> = ({
  visible,
  onClose,
  title = 'WhatsApp Reminder',
  timeAgo = '1 mnt lalu',
  message = 'Selamat pagi! ☀️\nAnda memiliki jadwal "Meeting Proyek SIMOLI" pukul 08.00 hari ini.'
}) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0d1629]/95 backdrop-blur-xl border border-[#25d366]/40 rounded-2xl p-4 shadow-[0_16px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(37,211,102,0.18)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start space-x-3.5">
        {/* WhatsApp Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#25d366] text-white flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(37,211,102,0.4)]">
          <MessageSquare className="w-5 h-5 fill-white" />
        </div>

        {/* Content */}
        <div className="flex-1 pr-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-100">{title}</h5>
            <span className="text-[10px] text-slate-400">{timeAgo}</span>
          </div>

          <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
