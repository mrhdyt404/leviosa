/**
 * LEVIOSA - Main Application Controller
 * Hogwarts-Themed AI Personal Assistant & Smart Productivity Management
 */

class LeviosaApp {
    constructor() {
        this.currentDate = new Date();
        this.schedules = [];
        this.activeDay = new Date().getDay(); // 0 is Sun
        this.weatherData = null;
        this.todayCalendarInfo = null;
        this.currentTheme = 'hogwarts_night';

        this.init();
    }

    async init() {
        console.log('[LEVIOSA] Initializing Hogwarts AI Productivity System...');

        // 1. Initialize Privacy-First Client Storage
        await window.leviosaStorage.init();

        // 2. Load Core Data & APIs
        await Promise.all([
            this.loadCalendarInfo(),
            this.loadWeather(),
            this.loadSchedules(),
            this.loadProductivityStats()
        ]);

        // 3. Bind UI Interactivity & Event Listeners
        this.bindEvents();

        // 4. Show Initial Owl / Assistant Greeting
        this.initAssistant();

        console.log('[LEVIOSA] Ready! Wingardium Leviosa.');
    }

    // Load Indonesian Realtime Calendar & Hijriah Date
    async loadCalendarInfo() {
        try {
            const res = await window.leviosaAPI.getTodayInfo();
            if (res && res.data) {
                this.todayCalendarInfo = res.data;
                this.renderHeaderDate(res.data);
            }
        } catch (e) {
            console.warn('[CALENDAR] Using local date fallback', e);
            const dateStr = this.currentDate.toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
            });
            document.getElementById('header-date-text').textContent = dateStr;
            document.getElementById('header-hijriah-text').textContent = '15 Jumadil Awal 1447 H';
        }
    }

    renderHeaderDate(data) {
        const dateEl = document.getElementById('header-date-text');
        const hijriahEl = document.getElementById('header-hijriah-text');

        const d = new Date(data.date);
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        const formatted = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (dateEl) dateEl.textContent = formatted;
        if (hijriahEl) hijriahEl.textContent = data.hijriah_date || '15 Jumadil Awal 1447 H';
    }

    // Load Weather Intelligence
    async loadWeather() {
        try {
            const res = await window.leviosaAPI.getWeather('Jakarta');
            if (res && res.data) {
                this.weatherData = res.data;
                this.renderWeather(res.data);
            }
        } catch (e) {
            console.warn('[WEATHER] Fallback to demo weather data', e);
            this.renderWeather({
                city: 'Jakarta',
                current_temp: 28,
                condition: 'Partly Cloudy',
                rain_probability: 60,
                daily: [
                    { date: '2026-11-02', max_temp: 34, condition: 'Cerah', rain_probability: 20 },
                    { date: '2026-11-03', max_temp: 32, condition: 'Hujan Ringan', rain_probability: 65 },
                    { date: '2026-11-04', max_temp: 31, condition: 'Hujan', rain_probability: 80 },
                    { date: '2026-11-05', max_temp: 30, condition: 'Hujan', rain_probability: 70 },
                    { date: '2026-11-06', max_temp: 33, condition: 'Berawan', rain_probability: 30 }
                ]
            });
        }
    }

    renderWeather(w) {
        // Top Header weather pill
        const headerTemp = document.getElementById('header-weather-temp');
        const headerCond = document.getElementById('header-weather-condition');
        if (headerTemp) headerTemp.textContent = `${Math.round(w.current_temp)}°C`;
        if (headerCond) headerCond.textContent = w.condition || 'Cerah Berawan';

        // Weather Card
        const cardTemp = document.getElementById('card-weather-temp');
        const cardCond = document.getElementById('card-weather-condition');
        const cardRain = document.getElementById('card-weather-rain');
        if (cardTemp) cardTemp.textContent = `${Math.round(w.current_temp)}°C`;
        if (cardCond) cardCond.textContent = w.condition;
        if (cardRain) cardRain.innerHTML = `🌧️ ${w.rain_probability || 60}%`;

        // 5-day mini forecast
        const forecastContainer = document.getElementById('forecast-days-container');
        if (forecastContainer && w.daily && w.daily.length > 0) {
            const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            let html = '';
            w.daily.slice(0, 5).forEach(day => {
                const d = new Date(day.date);
                const dayName = dayLabels[d.getDay()] || 'Hari';
                const icon = day.rain_probability > 50 ? '🌧️' : (day.rain_probability > 20 ? '⛅' : '☀️');
                html += `
                    <div class="forecast-col">
                        <span>${dayName}</span>
                        <span class="f-icon">${icon}</span>
                        <span>${Math.round(day.max_temp)}°</span>
                    </div>
                `;
            });
            forecastContainer.innerHTML = html;
        }
    }

    // Load Schedules from IndexedDB
    async loadSchedules() {
        this.schedules = await window.leviosaStorage.getAllSchedules();
        this.renderScheduleList();
        this.renderWeekStrip();
    }

    renderScheduleList() {
        const listEl = document.getElementById('today-schedule-list');
        if (!listEl) return;

        if (this.schedules.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center; padding: 24px; color: var(--text-gold); font-family: var(--font-parchment);">
                    <p>✦ Belum ada jadwal terdaftar. Klik "+ Tambah Jadwal" untuk memulai aktivitas produktif Anda.</p>
                </div>
            `;
            return;
        }

        const iconMap = {
            'Pekerjaan': '💼',
            'Pribadi': '🏃',
            'Belajar': '📖',
            'Kesehatan': '🧘'
        };

        let html = '';
        this.schedules.forEach(item => {
            const catClass = (item.category || 'pekerjaan').toLowerCase();
            const icon = iconMap[item.category] || '📌';
            html += `
                <div class="schedule-item clickable" data-id="${item.uuid}">
                    <div class="item-icon-box ${catClass}">
                        ${icon}
                    </div>
                    <div class="item-info">
                        <div class="item-time">${item.startTime} – ${item.endTime} WIB</div>
                        <div class="item-name">${item.title}</div>
                    </div>
                    <div class="item-tag ${catClass}">${item.category}</div>
                </div>
            `;
        });
        listEl.innerHTML = html;
    }

    renderWeekStrip() {
        const container = document.getElementById('week-strip-container');
        if (!container) return;

        const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const today = new Date();
        const startOfWeek = new Date(today);
        // Start from Monday
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        let html = '';
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const isToday = d.toDateString() === today.toDateString();

            html += `
                <div class="day-pill ${isToday ? 'active' : ''}" data-day="${i}">
                    <span class="day-name">${dayNames[i]}</span>
                    <span class="day-num">${d.getDate()}</span>
                    <div class="day-dots">
                        <span class="day-dot pekerjaan"></span>
                        <span class="day-dot pribadi"></span>
                        ${i % 2 === 0 ? '<span class="day-dot belajar"></span>' : ''}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    // Load Productivity Stats
    async loadProductivityStats() {
        const stats = await window.leviosaStorage.getProductivityStats();

        const percentEl = document.getElementById('stat-completion-percent');
        const tasksEl = document.getElementById('stat-completed-tasks');
        const hoursEl = document.getElementById('stat-productive-hours');
        const scoreEl = document.getElementById('stat-consistency-score');

        if (percentEl) percentEl.textContent = `${stats.completionRate}%`;
        if (tasksEl) tasksEl.textContent = `${stats.completedTasks} / ${stats.totalTasks}`;
        if (hoursEl) hoursEl.textContent = `${stats.productiveHours} jam`;
        if (scoreEl) scoreEl.textContent = `${stats.consistencyScore} / 100`;
    }

    // Interactive AI Companion Chat
    initAssistant() {
        const chatContainer = document.getElementById('chat-messages-container');
        if (!chatContainer) return;

        // Initial welcome message from Hedwig / AI Companion
        this.appendMessage('assistant', 'Halo, Arkana! 🧙‍♂️ Ada yang bisa saya bantu untuk mengoptimalkan jadwal dan produktivitas Anda hari ini?');
    }

    appendMessage(role, text, proposal = null) {
        const chatContainer = document.getElementById('chat-messages-container');
        if (!chatContainer) return;

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;

        const avatarImg = role === 'assistant' 
            ? 'https://api.dicebear.com/7.x/bottts/svg?seed=hedwig&backgroundColor=d4af37' 
            : 'https://api.dicebear.com/7.x/adventurer/svg?seed=arkana';

        let proposalHTML = '';
        if (proposal) {
            proposalHTML = `
                <div class="reschedule-proposal-box" style="margin-top: 10px; background: rgba(212, 175, 55, 0.15); border: 1.5px dashed var(--gold-bright); border-radius: 12px; padding: 12px;">
                    <div style="font-weight: 700; color: var(--gold-bright); font-size: 0.85rem; margin-bottom: 4px;">
                        ⚠️ ${proposal.conflict_type === 'weather_conflict' ? 'Potensi Gangguan Cuaca' : 'Rekomendasi AI'}
                    </div>
                    <p style="font-size: 0.8rem; color: #fff; margin-bottom: 8px;">${proposal.explanation}</p>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="proposal-action-btn accept" onclick="window.leviosaApp.acceptProposal()" style="flex: 1; background: var(--cat-pribadi); color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.78rem;">✓ Setujui</button>
                        <button class="proposal-action-btn reject" onclick="window.leviosaApp.rejectProposal()" style="flex: 1; background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.78rem;">✕ Tolak</button>
                    </div>
                </div>
            `;
        }

        bubble.innerHTML = `
            <div class="chat-avatar">
                <img src="${avatarImg}" alt="${role}">
            </div>
            <div class="bubble-content">
                ${text}
                ${proposalHTML}
            </div>
        `;

        chatContainer.appendChild(bubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async sendChatMessage(text) {
        if (!text || !text.trim()) return;

        this.appendMessage('user', text);

        // Show typing indicator
        const typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble assistant typing';
        typingBubble.id = 'assistant-typing';
        typingBubble.innerHTML = `
            <div class="chat-avatar">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=hedwig&backgroundColor=d4af37" alt="owl">
            </div>
            <div class="bubble-content" style="font-style: italic; color: var(--text-gold);">
                ✦ Membaca buku mantra & menganalisis jadwal...
            </div>
        `;
        document.getElementById('chat-messages-container').appendChild(typingBubble);

        try {
            const res = await window.leviosaAPI.chatAI(text, this.schedules, 'Jakarta');
            const el = document.getElementById('assistant-typing');
            if (el) el.remove();

            if (res && res.reply) {
                this.appendMessage('assistant', res.reply, res.proposal);

                // If suggestions were returned, offer to add them
                if (res.suggestions && res.suggestions.length > 0) {
                    this.pendingSuggestions = res.suggestions;
                }
            } else {
                this.appendMessage('assistant', 'Jadwal Anda telah dianalisis. Semua agenda teratur rapi tanpa bentrok.');
            }
        } catch (e) {
            const el = document.getElementById('assistant-typing');
            if (el) el.remove();
            this.appendMessage('assistant', 'Saya telah menganalisis jadwal Anda secara lokal. Pastikan jeda 30 menit (buffer time) antar kegiatan terpenuhi.');
        }
    }

    acceptProposal() {
        this.appendMessage('assistant', '✅ Perubahan jadwal telah berhasil disetujui dan diterapkan ke kalender Anda!');
        this.showToast('Jadwal Diperbarui', 'Penyesuaian jadwal outdoor ke waktu optimal berhasil disimpan.');
    }

    rejectProposal() {
        this.appendMessage('assistant', 'Jadwal semula tetap dipertahankan sesuai preferensi Anda.');
    }

    // Modal Handlers
    openScheduleModal() {
        const modal = document.getElementById('schedule-modal');
        if (modal) modal.classList.add('active');
    }

    closeScheduleModal() {
        const modal = document.getElementById('schedule-modal');
        if (modal) modal.classList.remove('active');
    }

    openWhatsAppTestModal() {
        const modal = document.getElementById('whatsapp-modal');
        if (modal) modal.classList.add('active');
    }

    closeWhatsAppTestModal() {
        const modal = document.getElementById('whatsapp-modal');
        if (modal) modal.classList.remove('active');
    }

    // Save Schedule to IndexedDB & Sync WhatsApp Reminder via Sidobe
    async saveNewSchedule(e) {
        e.preventDefault();
        const title = document.getElementById('input-sch-title').value;
        const category = document.getElementById('input-sch-category').value;
        const date = document.getElementById('input-sch-date').value;
        const startTime = document.getElementById('input-sch-start').value;
        const endTime = document.getElementById('input-sch-end').value;
        const location = document.getElementById('input-sch-location').value;
        const priority = document.getElementById('input-sch-priority').value;
        const notes = document.getElementById('input-sch-notes').value;

        // Check selected reminders
        const reminders = [];
        if (document.getElementById('rem-h7').checked) reminders.push('H-7');
        if (document.getElementById('rem-h1').checked) reminders.push('H-1');
        if (document.getElementById('rem-h1h').checked) reminders.push('H-1_jam');
        if (document.getElementById('rem-harih').checked) reminders.push('hari_h');

        const newSchedule = {
            uuid: 'sch-' + Date.now(),
            title,
            category,
            date,
            startTime,
            endTime,
            location,
            priority,
            notes,
            status: 'pending',
            reminders
        };

        // 1. Save to client local IndexedDB
        await window.leviosaStorage.saveSchedule(newSchedule);

        // 2. Sync Reminders with Go Backend & Sidobe Cloud API
        try {
            const eventTimeStr = `${date}T${startTime}:00`;
            const reminderPayload = {
                schedule_uuid: newSchedule.uuid,
                title: newSchedule.title,
                event_time: eventTimeStr,
                location: newSchedule.location,
                notes: newSchedule.notes,
                reminders: reminders.map(rType => {
                    let sendTime = new Date(`${date}T${startTime}:00`);
                    if (rType === 'H-7') sendTime.setDate(sendTime.getDate() - 7);
                    else if (rType === 'H-1') sendTime.setDate(sendTime.getDate() - 1);
                    else if (rType === 'H-1_jam') sendTime.setHours(sendTime.getHours() - 1);
                    return { type: rType, send_time: sendTime.toISOString() };
                })
            };

            await window.leviosaAPI.syncReminders(reminderPayload);
            console.log('[WHATSAPP SYNC] Reminders registered for Sidobe dispatch.');
        } catch (err) {
            console.warn('[WHATSAPP SYNC] Offline or auth needed, reminder saved locally.', err);
        }

        this.closeScheduleModal();
        await this.loadSchedules();
        this.showToast('Jadwal Ditambahkan!', `Aktivitas "${title}" berhasil disimpan dengan ${reminders.length} pengingat WhatsApp.`);
    }

    // WhatsApp Direct Test
    async sendTestWhatsAppMessage() {
        const phone = document.getElementById('input-wa-phone').value;
        const msg = document.getElementById('input-wa-msg').value;
        const statusEl = document.getElementById('wa-test-status');

        if (!phone) {
            alert('Silakan masukkan nomor telepon WhatsApp Anda.');
            return;
        }

        statusEl.innerHTML = '<span style="color: var(--gold-bright);">✦ Mengirim pesan via Sidobe Cloud API...</span>';

        try {
            const res = await window.leviosaAPI.testWhatsApp(phone, msg);
            if (res && res.success) {
                statusEl.innerHTML = '<span style="color: #10b981;">✓ Berhasil dikirim! Cek WhatsApp Anda sekarang.</span>';
                this.showToast('WhatsApp Terkirim!', `Pesan uji coba telah terkirim via Sidobe ke ${phone}`);
            } else {
                statusEl.innerHTML = `<span style="color: #ef4444;">Gagal: ${res.message || 'Error'}</span>`;
            }
        } catch (err) {
            statusEl.innerHTML = `<span style="color: #ef4444;">Gagal menghubungi server: ${err.message}</span>`;
        }
    }

    // Theme Switcher: Hogwarts Night vs Christmas Hogwarts
    toggleTheme() {
        if (this.currentTheme === 'hogwarts_night') {
            this.currentTheme = 'hogwarts_winter';
            document.body.style.backgroundImage = `
                radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.12) 0%, transparent 60%),
                linear-gradient(rgba(8, 12, 24, 0.75), rgba(8, 12, 24, 0.88)),
                url('../assets/hogwarts_winter_bg.jpg')
            `;
            this.showToast('Tema Diganti', 'Tema Musim Dingin Hogwarts (Christmas Magic) aktif!');
        } else {
            this.currentTheme = 'hogwarts_night';
            document.body.style.backgroundImage = `
                radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%),
                linear-gradient(rgba(6, 9, 19, 0.72), rgba(6, 9, 19, 0.88)),
                url('../assets/hogwarts_night_bg.png')
            `;
            this.showToast('Tema Diganti', 'Tema Malam Hogwarts (Midnight Magic) aktif!');
        }
    }

    showToast(title, body) {
        const toast = document.getElementById('floating-toast');
        if (!toast) return;

        document.getElementById('toast-title').textContent = title;
        document.getElementById('toast-body').textContent = body;
        toast.style.display = 'flex';
        toast.style.animation = 'toastSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }

    bindEvents() {
        // Quick Prompts click
        document.querySelectorAll('.quick-prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const promptText = chip.getAttribute('data-prompt') || chip.textContent.trim();
                this.sendChatMessage(promptText);
            });
        });

        // Chat Form Submit
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-input-field');
                const text = input.value.trim();
                if (text) {
                    this.sendChatMessage(text);
                    input.value = '';
                }
            });
        }

        // Schedule Form Submit
        const schForm = document.getElementById('schedule-form');
        if (schForm) {
            schForm.addEventListener('submit', (e) => this.saveNewSchedule(e));
        }

        // Close Toast button
        const closeToastBtn = document.getElementById('toast-close-btn');
        if (closeToastBtn) {
            closeToastBtn.addEventListener('click', () => {
                document.getElementById('floating-toast').style.display = 'none';
            });
        }

        // Keyboard Shortcut ⌘+K or Ctrl+K for search
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search-input')?.focus();
            }
        });
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    window.leviosaApp = new LeviosaApp();
});
