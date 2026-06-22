#!/bin/bash

# Berhenti otomatis jika ada perintah yang error
set -e

echo "🚀 Memulai setup server panitia (Rocky Linux)..."

# 1. Update sistem
echo "📦 Mengupdate dnf cache dan sistem..."
sudo dnf update -y

# 2. Install Git, Curl, dan utilitas dnf
echo "🛠️ Menginstal Git dan tools dasar..."
sudo dnf install -y git curl ca-certificates dnf-utils

# 3. Menambahkan Repositori Resmi Docker & Install
echo "🐳 Menyiapkan repository dan menginstal Docker & Docker Compose..."
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Aktifkan Docker agar jalan otomatis saat server restart
echo "⚙️ Mengaktifkan service Docker..."
sudo systemctl enable docker
sudo systemctl start docker

# 5. Masukkan user saat ini ke grup docker
echo "🔑 Memberikan akses Docker ke user..."
# Catatan: Karena kamu mengeksekusi via root, $USER adalah root.
sudo usermod -aG docker $USER

# 6. Buat folder proyek
echo "📁 Membuat direktori ~/home/hackathon..."
mkdir -p ~/home/hackathon

echo "✅ Setup selesai! Server Rocky Linux sudah siap menerima deploy dari GitHub Actions."