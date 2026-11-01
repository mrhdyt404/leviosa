/**
 * LEVIOSA - API Client for Go Backend Services
 * Connects to http://localhost:8080/api/ with JWT auth & error handling
 */

class LeviosaAPI {
    constructor() {
        this.baseURL = window.location.origin.includes(':8080') 
            ? window.location.origin + '/api' 
            : 'http://localhost:8080/api';
        this.token = localStorage.getItem('leviosa_token') || '';
    }

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('leviosa_token', token);
        else localStorage.removeItem('leviosa_token');
    }

    getHeaders(isJSON = true) {
        const headers = {};
        if (isJSON) headers['Content-Type'] = 'application/json';
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const res = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(options.body && !(options.body instanceof FormData)),
                    ...(options.headers || {})
                }
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || data.message || `HTTP ${res.status}`);
            }
            return data;
        } catch (err) {
            console.warn(`[API ERROR] ${endpoint}:`, err.message);
            throw err;
        }
    }

    // Health Check
    async checkHealth() {
        return this.request('/health', { method: 'GET' });
    }

    // Auth
    async login(usernameOrEmail, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username_or_email: usernameOrEmail, password })
        });
        if (data.token) this.setToken(data.token);
        return data;
    }

    async register(name, username, email, phone, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, username, email, phone, password })
        });
    }

    async getMe() {
        return this.request('/auth/me', { method: 'GET' });
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken('');
        }
    }

    // Indonesian Calendar
    async getTodayInfo() {
        return this.request('/calendar/today', { method: 'GET' });
    }

    async getHolidays(year = 2026) {
        return this.request(`/calendar/holidays?year=${year}`, { method: 'GET' });
    }

    // Weather Intelligence
    async getWeather(city = 'Jakarta') {
        return this.request(`/weather?city=${encodeURIComponent(city)}`, { method: 'GET' });
    }

    // WhatsApp Reminder (Sidobe Cloud API)
    async testWhatsApp(phone, message) {
        return this.request('/reminders/test', {
            method: 'POST',
            body: JSON.stringify({ phone, message })
        });
    }

    async syncReminders(payload) {
        return this.request('/reminders/sync', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // AI Personal Assistant
    async chatAI(message, currentSchedules = [], userCity = 'Jakarta') {
        return this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                message,
                current_schedules: currentSchedules,
                user_city: userCity
            })
        });
    }

    async evaluateProductivity(metrics) {
        return this.request('/ai/evaluate', {
            method: 'POST',
            body: JSON.stringify(metrics)
        });
    }
}

window.leviosaAPI = new LeviosaAPI();
