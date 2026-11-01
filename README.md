# LEVIOSA (Smart Productivity Ecosystem)

> *"You don't need more time. You need a smarter way to live it."*

Leviosa adalah **AI Personal Assistant & Smart Productivity Management System** yang dirancang bukan sekadar kalender atau to-do list konvensional, melainkan asisten pribadi digital yang memahami rutinitas, mengelola waktu, memprediksi kendala lingkungan (seperti cuaca), memberikan rekomendasi proaktif dengan konfirmasi pengguna, dan mengevaluasi produktivitas harian hingga tahunan.

---

## 🏛️ Arsitektur & Prinsip Penyimpanan Data (Privacy-First)

Sesuai spesifikasi arsitektur:
- **Client (Web PWA / Mobile Responsive):** Seluruh data aktivitas harian, jadwal, time-blocking, to-do list, dan habit tracker disimpan di penyimpanan lokal perangkat pengguna (*IndexedDB / LocalStorage*) untuk menjaga privasi pengguna dan tidak membebani kapasitas penyimpanan server.
- **Server Internal (Golang & MariaDB):** Server hanya menyimpan:
  1. Data akun dan autentikasi pengguna (`users`, WebAuthn / Face Auth credentials).
  2. Sesi aktif dan riwayat autentikasi (`sessions`).
  3. Log aktivitas login/logout aktif-nonaktif (`activity_logs`).
  4. Antrean dan trigger pengingat WhatsApp terenkripsi (`whatsapp_notifications`) untuk dikirimkan otomatis oleh background worker server via Sidobe Cloud API pada H-7, H-1, H-1 Jam, dan Hari H.
  5. Log usulan rekomendasi jadwal AI (`ai_recommendations`).

---

## 🚀 Setup Database MariaDB & User Privilege

Database menggunakan **MariaDB / MySQL** dengan akun user khusus (*least-privilege principle*):

| Parameter | Nilai Default |
|-----------|---------------|
| Database  | `leviosa` (utf8mb4_unicode_ci) |
| Host      | `127.0.0.1:3306` |
| Username  | `leviosa` |
| Password  | `LeviosaSecurePass2026!` |

### Langkah Eksekusi Setup Database
Untuk membuat database `leviosa` dan user privilesenya di MariaDB, jalankan skrip berikut di terminal:

```bash
# Opsi 1: Menggunakan skrip otomatis
./scripts/setup_mariadb.sh

# Opsi 2: Menggunakan mysql root langsung
sudo mysql < init_db.sql
```

Skrip ini akan secara otomatis:
1. Membuat database `leviosa`.
2. Membuat user `leviosa`@'localhost' dan `leviosa`@'127.0.0.1' dengan password `LeviosaSecurePass2026!`.
3. Memberikan hak akses penuh (`ALL PRIVILEGES`) hanya pada database `leviosa`.*.
4. Membuat 6 tabel inti sistem.

---

## 📱 Integrasi WhatsApp Cloud API (Sidobe)

Aplikasi terintegrasi dengan **Sidobe WhatsApp Cloud API**:
- **Production URL:** `https://api.sidobe.com/wa/v1`
- **Secret Key:** `lWRBndGzxoDBZDilgoKTsLvePaYEaspKZCyFbirxRTyaxzrOEO`
- **Header Auth:** `X-Secret-Key: <secret_key>`
- **Background Worker:** Worker berjalan setiap 30 detik untuk mengecek pengingat yang jatuh tempo (`send_time <= NOW()`) dan mengirim notifikasi WhatsApp otomatis.

---

## 🛠️ Menjalankan Backend Server

```bash
cd backend
go run main.go
# atau jalankan binary yang sudah dikompilasi:
./leviosa-server
```

Server akan aktif di: `http://localhost:8080`

### Uji Coba Endpoint:
- **Health Check:**
  ```bash
  curl -s http://localhost:8080/api/health
  ```
- **Kalender Aktif & Hari Libur Indonesia:**
  ```bash
  curl -s "http://localhost:8080/api/calendar/holidays?year=2026"
  curl -s "http://localhost:8080/api/calendar/today"
  ```
- **Prediksi Cuaca Realtime:**
  ```bash
  curl -s "http://localhost:8080/api/weather?city=Jakarta"
  ```
- **Test Kirim WhatsApp via Sidobe:**
  ```bash
  curl -X POST http://localhost:8080/api/reminders/test \
    -H "Content-Type: application/json" \
    -d '{"phone": "08xxxxxxxxxx", "message": "Halo dari Leviosa!"}'
  ```
- **Chat Asisten AI & Rekomendasi Jadwal:**
  ```bash
  curl -X POST http://localhost:8080/api/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Besok saya ingin olahraga outdoor jam 16:00 dan belajar 2 jam"}'
  ```
