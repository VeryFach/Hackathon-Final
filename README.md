## 🛠 Prasyarat Sistem

Sebelum menjalankan proyek ini, pastikan sistem kamu sudah terinstal perangkat lunak berikut:

1. **Node.js** (v18 atau lebih baru)
2. **pnpm** (Package manager, instal via `npm i -g pnpm`)
3. **Docker & Docker Compose** (Untuk menjalankan ketiga database secara lokal)

## 🚀 Tata Cara Instalasi

Ikuti langkah-langkah berikut untuk menginisialisasi *environment* pengembangan di komputer lokal kamu:

1. **Clone Repositori (Jika belum)**
```bash
git clone <url-repo-cafescope>
cd cafescope
```


2. **Install Dependensi**
Gunakan `pnpm` di direktori *root* untuk menginstal seluruh dependensi aplikasi dan *packages*.
```bash
pnpm install
```


3. **Jalankan Infrastruktur Database (Docker)**
Nyalakan kontainer PostgreSQL dan PostGIS. Perintah ini akan berjalan di *background* (`-d`).
```bash
docker-compose up -d
```

## 🏃‍♂️ Cara Menjalankan Aplikasi

Berkat **Turborepo**, kamu memiliki fleksibilitas untuk menjalankan seluruh *service* sekaligus atau hanya *service* tertentu saja yang sedang kamu kembangkan.

### Opsi 1: Menjalankan SEMUA Service (Disarankan)

Gunakan perintah ini di direktori *root*  secara paralel.

```bash
pnpm dev
```

> Turborepo akan mengeksekusi *script* `start:dev` ke seluruh aplikasi yang ada di dalam folder `apps/`.

### Opsi 2: Menjalankan PER Service (Spesifik)

Jika kamu hanya ingin fokus mengembangkan satu *service* tanpa harus menyalakan semuanya (misal komputer sedang berat), kamu bisa memanfaatkan *flag* `--filter` dari pnpm.

Jalankan perintah ini di direktori *root*:

**Menyalakan hanya API:**

```bash
pnpm --filter api dev
```

**Menyalakan hanya Web:**

```bash
pnpm --filter web dev
```

*(Ganti `web` dengan nama folder aplikasi lain di dalam `apps/` sesuai kebutuhan).*