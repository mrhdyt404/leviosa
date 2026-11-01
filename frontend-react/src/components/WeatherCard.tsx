import React from 'react';
import { CloudRain, Droplets } from 'lucide-react';
import type { WeatherResponse } from '../services/api';

interface WeatherCardProps {
  weather: WeatherResponse | null;
  onOpenDetails: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  onOpenDetails
}) => {
  const currentTemp = weather ? `${weather.temperature}°C` : '26°C';
  const currentCondition = weather?.condition || 'Hujan Ringan';
  const rainChance = weather ? `${weather.rain_probability}%` : '60%';

  const forecast = weather?.forecast || [
    { day: 'Sel', temp: 26, condition: 'Hujan' },
    { day: 'Rab', temp: 27, condition: 'Hujan' },
    { day: 'Kam', temp: 28, condition: 'Berawan' },
    { day: 'Jum', temp: 29, condition: 'Cerah Berawan' },
    { day: 'Sab', temp: 30, condition: 'Cerah' }
  ];

  const getConditionIcon = (cond: string) => {
    if (cond.toLowerCase().includes('hujan')) return '🌧️';
    if (cond.toLowerCase().includes('awan') || cond.toLowerCase().includes('cloudy')) return '⛅';
    return '☀️';
  };

  return (
    <div className="glass-panel glass-panel-corner rounded-2xl p-5 flex flex-col justify-between h-full select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#d4af37]/20">
          <div className="flex items-center space-x-2">
            <span className="text-base text-[#ffd700]">🌦️</span>
            <h3 className="font-cinzel text-sm font-bold text-slate-100 tracking-wide">
              Prediksi Cuaca
            </h3>
          </div>
          <button
            onClick={onOpenDetails}
            className="text-xs text-[#d4af37] hover:text-[#ffd700] transition-colors flex items-center space-x-1 group"
          >
            <span>Lihat Detail</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>

        {/* Hero Weather Section */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center space-x-3.5">
            {/* Weather Large Icon */}
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-2xl shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <CloudRain className="w-7 h-7 text-blue-400" />
            </div>

            {/* Temperature & Condition */}
            <div>
              <h3 className="font-cinzel text-2xl font-bold text-slate-100 leading-none">
                {currentTemp}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {currentCondition}
              </p>
            </div>
          </div>

          {/* Rain Probability Pill */}
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-semibold shadow-sm">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>{rainChance}</span>
          </div>
        </div>
      </div>

      {/* 5-Day Mini Forecast Columns */}
      <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-[#d4af37]/15 text-center mt-3">
        {forecast.map((item, idx) => (
          <div
            key={idx}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex flex-col items-center"
          >
            <span className="text-[10px] text-slate-400 font-medium">{item.day}</span>
            <span className="text-base my-0.5">{getConditionIcon(item.condition)}</span>
            <span className="text-[11px] font-semibold text-slate-200">{item.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};
