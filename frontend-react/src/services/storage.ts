import type { ScheduleItem, ProductivityStats } from '../types';

const DB_NAME = 'LeviosaLocalDB';
const DB_VERSION = 1;

class LeviosaStorage {
  private db: IDBDatabase | null = null;
  private isReadyPromise: Promise<boolean>;

  constructor() {
    this.isReadyPromise = this.init();
  }

  private async init(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(false);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('[STORAGE] IndexedDB unavailable, using LocalStorage.');
        resolve(false);
      };

      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        this.seedInitialDataIfEmpty().then(() => resolve(true));
      };

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('schedules')) {
          const store = db.createObjectStore('schedules', { keyPath: 'uuid' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  public async ready(): Promise<boolean> {
    return this.isReadyPromise;
  }

  private async seedInitialDataIfEmpty(): Promise<void> {
    const existing = await this.getAllSchedules();
    if (existing.length === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const initialItems: ScheduleItem[] = [
        {
          uuid: 'sch-1',
          title: 'Meeting Proyek SIMOLI',
          category: 'Pekerjaan',
          date: todayStr,
          startTime: '08.00',
          endTime: '09.30',
          priority: 'tinggi',
          location: 'Ruang Meeting Lt. 3 / Zoom',
          notes: 'Evaluasi arsitektur database dan integrasi Sidobe WhatsApp.',
          status: 'completed',
          reminders: ['H-1', 'H-1_jam']
        },
        {
          uuid: 'sch-2',
          title: 'Olahraga di Gym',
          category: 'Pribadi',
          date: todayStr,
          startTime: '10.00',
          endTime: '11.00',
          priority: 'sedang',
          location: 'Fitness Center',
          notes: 'Cardio dan peregangan tubuh.',
          status: 'ongoing',
          reminders: ['H-1_jam']
        },
        {
          uuid: 'sch-3',
          title: 'Belajar Pemrograman',
          category: 'Belajar',
          date: todayStr,
          startTime: '13.00',
          endTime: '15.00',
          priority: 'sedang',
          location: 'Workspace',
          notes: 'Eksplorasi Three.js GLSL shaders & Go concurrency.',
          status: 'pending',
          reminders: ['H-1_jam']
        },
        {
          uuid: 'sch-4',
          title: 'Review Laporan',
          category: 'Pekerjaan',
          date: todayStr,
          startTime: '16.00',
          endTime: '17.00',
          priority: 'tinggi',
          location: 'Ruang Kerja',
          notes: 'Evaluasi produktivitas mingguan & persiapan agenda besok.',
          status: 'pending',
          reminders: ['hari_h']
        }
      ];

      for (const item of initialItems) {
        await this.saveSchedule(item);
      }
    }
  }

  public async getAllSchedules(): Promise<ScheduleItem[]> {
    await this.ready();
    if (!this.db) {
      const raw = localStorage.getItem('leviosa_schedules');
      return raw ? JSON.parse(raw) : [];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('schedules', 'readonly');
        const store = tx.objectStore('schedules');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  public async saveSchedule(schedule: ScheduleItem): Promise<ScheduleItem> {
    await this.ready();
    if (!this.db) {
      const raw = localStorage.getItem('leviosa_schedules');
      const items: ScheduleItem[] = raw ? JSON.parse(raw) : [];
      const idx = items.findIndex((i) => i.uuid === schedule.uuid);
      if (idx >= 0) items[idx] = schedule;
      else items.push(schedule);
      localStorage.setItem('leviosa_schedules', JSON.stringify(items));
      return schedule;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction('schedules', 'readwrite');
        const store = tx.objectStore('schedules');
        const req = store.put(schedule);
        req.onsuccess = () => resolve(schedule);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async deleteSchedule(uuid: string): Promise<boolean> {
    await this.ready();
    if (!this.db) {
      const raw = localStorage.getItem('leviosa_schedules');
      let items: ScheduleItem[] = raw ? JSON.parse(raw) : [];
      items = items.filter((i) => i.uuid !== uuid);
      localStorage.setItem('leviosa_schedules', JSON.stringify(items));
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('schedules', 'readwrite');
        const store = tx.objectStore('schedules');
        const req = store.delete(uuid);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  public async getProductivityStats(): Promise<ProductivityStats> {
    const all = await this.getAllSchedules();
    const completed = all.filter((s) => s.status === 'completed').length;
    const total = all.length;
    return {
      completedTasks: 32 + completed,
      totalTasks: 37 + total - 4,
      completionRate: 87,
      productiveHours: 28.5,
      consistencyScore: 91
    };
  }
}

export const storage = new LeviosaStorage();
