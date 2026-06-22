#!/bin/bash

# Berhenti otomatis jika ada perintah yang error
set -e

echo "🚀 Memulai setup server panitia..."

# 1. Update sistem
echo "📦 Mengupdate apt cache..."
sudo apt-get update -y

# 2. Install Git & Curl
echo "🛠️ Menginstal Git dan tools dasar..."
sudo apt-get install -y git curl ca-certificates

# 3. Install Docker & Docker Compose
echo "🐳 Menginstal Docker & Docker Compose..."
sudo apt-get install -y docker.io docker-compose-v2

# 4. Aktifkan Docker agar jalan otomatis saat server restart
echo "⚙️ Mengaktifkan service Docker..."
sudo systemctl enable docker
sudo systemctl start docker

# 5. Masukkan user saat ini ke grup docker (biar gak perlu sudo terus)
echo "🔑 Memberikan akses Docker ke user..."
sudo usermod -aG docker $USER

# 6. Buat folder proyek
echo "📁 Membuat direktori ~/home/hackathon..."
mkdir -p ~/home/hackathon

echo "✅ Setup selesai! Server sudah siap menerima deploy dari GitHub Actions."