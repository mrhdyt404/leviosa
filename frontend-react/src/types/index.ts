export interface ScheduleItem {
  uuid: string;
  title: string;
  category: 'Pekerjaan' | 'Pribadi' | 'Belajar' | 'Kesehatan';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  priority: 'tinggi' | 'sedang' | 'rendah';
  location?: string;
  isOutdoor?: boolean;
  notes?: string;
  status: 'pending' | 'ongoing' | 'completed';
  reminders: string[]; // ['H-7', 'H-1', 'H-1_jam', 'hari_h']
}

export interface TaskItem {
  id: number;
  title: string;
  completed: boolean;
  priority: 'tinggi' | 'sedang' | 'rendah';
  dueDate?: string;
}

export interface ProductivityStats {
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  productiveHours: number;
  consistencyScore: number;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  rainChance: number;
  icon: string;
  forecast: {
    day: string;
    temp: number;
    icon: string;
  }[];
}

export interface CalendarDayInfo {
  date: string;
  dayName: string;
  hijriah: string;
  isHoliday: boolean;
  holidayName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}
