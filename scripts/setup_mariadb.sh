#!/bin/bash
# =====================================================================
# Script Setup Database & Dedicated User MariaDB untuk Leviosa
# =====================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SQL_FILE="$PROJECT_ROOT/init_db.sql"

echo "=========================================================="
echo "  LEVIOSA - Setup Database MariaDB & User Privilege"
echo "=========================================================="

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: File $SQL_FILE tidak ditemukan!"
    exit 1
fi

echo "Mengeksekusi inisialisasi database dan user khusus 'leviosa'..."
echo "Perintah: sudo mysql < $SQL_FILE"
echo ""

sudo mysql < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database 'leviosa' dan user 'leviosa'@'localhost' / '127.0.0.1' BERHASIL dibuat!"
    echo "✅ Kredensial aktif:"
    echo "   Database : leviosa"
    echo "   User     : leviosa"
    echo "   Password : LeviosaSecurePass2026!"
    echo "   Host     : 127.0.0.1:3306"
    echo ""
    echo "Menguji koneksi dengan user 'leviosa'..."
    mariadb -h 127.0.0.1 -u leviosa -p'LeviosaSecurePass2026!' -e "USE leviosa; SHOW TABLES;"
else
    echo "❌ Terjadi kegagalan saat mengeksekusi dengan sudo mysql."
    echo "Silakan jalankan manual: sudo mysql < $SQL_FILE"
fi
