/**
 * LEVIOSA API Client
 * Connects to Go REST API (http://localhost:8080/api)
 */

export interface HealthResponse {
  status: string;
  app: string;
  database: string;
  version: string;
  server_time: string;
  advance_security?: string;
}

export interface TodayCalendarResponse {
  date: string;
  day_name_id: string;
  hijriah: string;
  is_holiday: boolean;
  holiday_name?: string;
}

export interface WeatherResponse {
  city: string;
  temperature: number;
  condition: string;
  rain_probability: number;
  forecast?: {
    day: string;
    temp: number;
    condition: string;
  }[];
}

export interface AIChatResponse {
  reply: string;
  buffer_suggested_minutes?: number;
  suggested_actions?: string[];
}

export interface SidobeTestResponse {
  success: boolean;
  message: string;
  status?: string;
  is_async?: boolean;
}

class LeviosaAPI {
  private baseURL: string;
  private token: string;

  constructor() {
    this.baseURL = typeof window !== 'undefined' && window.location.origin.includes(':8080')
      ? `${window.location.origin}/api`
      : 'http://localhost:8080/api';
    this.token = typeof window !== 'undefined' ? (localStorage.getItem('leviosa_token') || '') : '';
  }

  public setToken(token: string) {
    this.token = token;
    if (token) localStorage.setItem('leviosa_token', token);
    else localStorage.removeItem('leviosa_token');
  }

  private getHeaders(isJSON = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJSON) headers['Content-Type'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(Boolean(options.body && !(options.body instanceof FormData))),
          ...(options.headers as Record<string, string> || {})
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      return data as T;
    } catch (err: unknown) {
      console.warn(`[API] ${endpoint} request failed:`, (err as Error).message);
      throw err;
    }
  }

  public async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  public async getTodayCalendar(): Promise<TodayCalendarResponse> {
    return this.request<TodayCalendarResponse>('/calendar/today');
  }

  public async getWeather(city = 'Jakarta'): Promise<WeatherResponse> {
    return this.request<WeatherResponse>(`/weather?city=${encodeURIComponent(city)}`);
  }

  public async testWhatsApp(phone: string, message: string): Promise<SidobeTestResponse> {
    return this.request<SidobeTestResponse>('/reminders/test', {
      method: 'POST',
      body: JSON.stringify({ phone, message })
    });
  }

  public async chatAI(message: string, currentSchedules: unknown[] = [], userCity = 'Jakarta'): Promise<AIChatResponse> {
    return this.request<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        current_schedules: currentSchedules,
        user_city: userCity
      })
    });
  }
}

export const api = new LeviosaAPI();
