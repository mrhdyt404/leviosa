import { useState, useEffect } from 'react';
import { MagicCursor } from './components/MagicCursor';
import { BackgroundScene } from './components/BackgroundScene';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TodayScheduleCard } from './components/TodayScheduleCard';
import { WeekAgendaCard } from './components/WeekAgendaCard';
import { ProductivityCard } from './components/ProductivityCard';
import { WeatherCard } from './components/WeatherCard';
import { CompanionCard } from './components/CompanionCard';
import { BottomActionBar } from './components/BottomActionBar';
import { WhatsAppToast } from './components/WhatsAppToast';
import { ScheduleModal } from './components/ScheduleModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { CalendarModal } from './components/CalendarModal';

import type { ScheduleItem, ProductivityStats } from './types';
import { storage } from './services/storage';
import { api } from './services/api';
import type { TodayCalendarResponse, WeatherResponse } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'night' | 'winter'>('night');

  // Data States
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [productivityStats, setProductivityStats] = useState<ProductivityStats>({
    completedTasks: 32,
    totalTasks: 37,
    completionRate: 87,
    productiveHours: 28.5,
    consistencyScore: 91
  });
  const [todayInfo, setTodayInfo] = useState<TodayCalendarResponse | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  // Modals & Toasts
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const [toastVisible, setToastVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState(
    'Selamat pagi! ☀️\nAnda memiliki jadwal "Meeting Proyek SIMOLI" pukul 08.00 hari ini.'
  );

  // Load initial data
  const loadData = async () => {
    try {
      const sch = await storage.getAllSchedules();
      setSchedules(sch);

      const stats = await storage.getProductivityStats();
      setProductivityStats(stats);

      const cal = await api.getTodayCalendar().catch(() => null);
      if (cal) setTodayInfo(cal);

      const wth = await api.getWeather('Jakarta').catch(() => null);
      if (wth) setWeather(wth);
    } catch (err) {
      console.warn('Load data notice:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleScheduleStatus = async (uuid: string) => {
    const updated = schedules.map((item) => {
      if (item.uuid === uuid) {
        return {
          ...item,
          status: (item.status === 'completed' ? 'pending' : 'completed') as any
        };
      }
      return item;
    });
    setSchedules(updated);

    const target = updated.find((i) => i.uuid === uuid);
    if (target) {
      await storage.saveSchedule(target);
      const stats = await storage.getProductivityStats();
      setProductivityStats(stats);
    }
  };

  const handleSaveSchedule = async (newSchedule: ScheduleItem) => {
    await storage.saveSchedule(newSchedule);
    await loadData();
    setToastMessage(`Jadwal "${newSchedule.title}" tersimpan & pengingat Sidobe diaktifkan!`);
    setToastVisible(true);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'night' ? 'winter' : 'night'));
  };

  return (
    <div className="relative min-h-screen w-screen flex overflow-hidden text-slate-100 font-sans">
      {/* 1. Wingardium Leviosa Animated Flying Book Cursor */}
      <MagicCursor />

      {/* 2. 3D WebGL Background Scene (Three.js Particles + Hogwarts Castle) */}
      <BackgroundScene theme={theme} />

      {/* 3. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
      />

      {/* 4. Main Dashboard Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto px-8 py-6 z-10">
        {/* Top Header */}
        <Header
          todayInfo={todayInfo}
          weather={weather}
          onToggleTheme={handleToggleTheme}
          onOpenNotifications={() => {
            setToastMessage('Anda memiliki jadwal evaluasi laporan pukul 16.00 WIB.');
            setToastVisible(true);
          }}
          onSearch={(query: string) => {
            if (query.trim()) {
              const filtered = schedules.filter((s) =>
                s.title.toLowerCase().includes(query.toLowerCase())
              );
              setSchedules(filtered.length ? filtered : schedules);
            } else {
              storage.getAllSchedules().then(setSchedules);
            }
          }}
        />

        {/* 3-Column Dashboard Cards Grid */}
        <div className="grid grid-cols-12 gap-5 flex-1 items-stretch">
          {/* Column 1: Left (Jadwal Hari Ini & Ringkasan Produktivitas) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-5">
            <div className="flex-1 min-h-[260px]">
              <TodayScheduleCard
                schedules={schedules}
                onOpenModal={() => setIsScheduleModalOpen(true)}
                onToggleStatus={handleToggleScheduleStatus}
              />
            </div>
            <div className="flex-1 min-h-[220px]">
              <ProductivityCard
                stats={productivityStats}
                onViewReport={() => {
                  setToastMessage('Konsistensi produktivitas Anda berada di angka 91/100!');
                  setToastVisible(true);
                }}
              />
            </div>
          </div>

          {/* Column 2: Center (Agenda Minggu Ini & Prediksi Cuaca) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-5">
            <div className="flex-1 min-h-[260px]">
              <WeekAgendaCard />
            </div>
            <div className="flex-1 min-h-[220px]">
              <WeatherCard
                weather={weather}
                onOpenDetails={() => setIsCalendarModalOpen(true)}
              />
            </div>
          </div>

          {/* Column 3: Right (Leviosa Companion AI Assistant Chat) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col">
            <div className="flex-1 min-h-[490px]">
              <CompanionCard
                onScheduleCreated={loadData}
              />
            </div>
          </div>
        </div>

        {/* Bottom Ornate Action Bar */}
        <BottomActionBar
          onAddSchedule={() => setIsScheduleModalOpen(true)}
          onAddTask={() => setIsScheduleModalOpen(true)}
          onViewCalendar={() => setIsCalendarModalOpen(true)}
          onViewStats={() => {
            setToastMessage('Target produktivitas minggu ini tercapai 87% (32 dari 37 tugas).');
            setToastVisible(true);
          }}
          onOpenSettings={() => setIsWhatsAppModalOpen(true)}
        />
      </div>

      {/* 5. Floating WhatsApp Reminder Toast (Bottom Right) */}
      <WhatsAppToast
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        message={toastMessage}
      />

      {/* 6. Modals */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onSuccessNotification={(msg) => {
          setToastMessage(msg);
          setToastVisible(true);
        }}
      />

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </div>
  );
}

export default App;
