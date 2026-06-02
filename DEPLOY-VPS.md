# Panduan Deploy Portal GDN ke VPS

Panduan untuk tim IT men-deploy Portal GDN ke **VPS Linux** (mis. Niagahoster,
Ubuntu 22.04). Aplikasi berjalan sebagai **satu layanan**: backend Node.js
menyajikan frontend (hasil build) **dan** API `/api` dari satu port, dengan
**PostgreSQL** sebagai database.

```
Internet ─► Nginx (443/HTTPS) ─► Node.js/PM2 (port 4000) ─► PostgreSQL (5432)
                                  └─ menyajikan dist/ (frontend) + /api (backend)
```

**Komponen yang harus jalan di VPS:** Node.js 18+, PostgreSQL, Nginx, PM2,
Certbot (HTTPS). Prasyarat: akses **SSH/root** ke VPS + domain mengarah ke IP VPS.

---

## 1. Akses VPS & update sistem
```bash
ssh root@IP_VPS
apt update && apt upgrade -y
```

## 2. Install Node.js 20 (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # pastikan v20.x
```

## 3. Install PostgreSQL + buat database
```bash
apt install -y postgresql
sudo -u postgres psql <<'SQL'
CREATE DATABASE portal_gdn;
CREATE USER gdn_user WITH ENCRYPTED PASSWORD 'GANTI_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON DATABASE portal_gdn TO gdn_user;
\c portal_gdn
GRANT ALL ON SCHEMA public TO gdn_user;
SQL
```
> Catat connection string: `postgres://gdn_user:GANTI_PASSWORD_KUAT@localhost:5432/portal_gdn`

## 4. Ambil kode dari GitHub
```bash
apt install -y git
cd /var/www        # atau direktori pilihan
git clone https://github.com/budhits/portal-gdn.git
cd portal-gdn
```

## 5. Install dependency & build frontend
```bash
npm run build:all
# = npm install (root) + npm run build (frontend -> dist/) + npm install --prefix server
```

## 6. Konfigurasi environment backend
Buat file `server/.env`:
```bash
cat > server/.env <<'ENV'
DATABASE_URL=postgres://gdn_user:GANTI_PASSWORD_KUAT@localhost:5432/portal_gdn
DATABASE_SSL=false
NODE_ENV=production
PORT=4000
JWT_SECRET=GANTI_DENGAN_STRING_ACAK_PANJANG_DAN_RAHASIA
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
AUTO_MIGRATE=true
ENV
```
> - `DATABASE_SSL=false` karena PostgreSQL lokal (satu server).
> - `JWT_SECRET`: buat string acak, mis. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
> - `GOOGLE_CLIENT_ID`: dari Google Cloud (sama seperti yang dipakai sekarang).
> - `AUTO_MIGRATE=true`: saat start pertama, otomatis membuat skema + mengisi
>   data awal bila database masih kosong. Idempoten (aman diulang).

## 7. Jalankan dengan PM2 (auto-restart & auto-start saat reboot)
```bash
npm install -g pm2
cd /var/www/portal-gdn
pm2 start server/src/index.js --name portal-gdn
pm2 save
pm2 startup       # ikuti perintah yang ditampilkan agar jalan setelah reboot
```
Cek: `pm2 logs portal-gdn` — harus muncul `🚀 Portal GDN API berjalan ...` dan
(saat pertama) log pembuatan skema + pengisian data awal.

Uji lokal di server: `curl http://localhost:4000/api/health` → `{"ok":true,...}`

## 8. Nginx sebagai reverse proxy
```bash
apt install -y nginx
cat > /etc/nginx/sites-available/portal-gdn <<'NGINX'
server {
    listen 80;
    server_name portal.gerbangdigitalnusantara.co.id;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
ln -s /etc/nginx/sites-available/portal-gdn /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```
> Pastikan DNS domain (A record) mengarah ke **IP VPS** sebelum langkah ini.

## 9. HTTPS gratis (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d portal.gerbangdigitalnusantara.co.id
# pilih redirect HTTP -> HTTPS saat ditanya
```
Certbot otomatis memperbarui Nginx & menjadwalkan perpanjangan sertifikat.

## 10. Update origin di Google Cloud (Login Google)
Console Google Cloud → APIs & Services → Credentials → OAuth Client →
**Authorized JavaScript origins** → tambah:
```
https://portal.gerbangdigitalnusantara.co.id
```
(https, tanpa trailing slash). Client ID tidak berubah.

---

## Update aplikasi di masa depan (deploy versi baru)
```bash
cd /var/www/portal-gdn
git pull origin main
npm run build:all
pm2 restart portal-gdn
```

## Operasional & pemeliharaan
| Kebutuhan | Perintah |
|---|---|
| Lihat status/log | `pm2 status` · `pm2 logs portal-gdn` |
| Restart | `pm2 restart portal-gdn` |
| Backup database | `pg_dump -U gdn_user portal_gdn > backup_$(date +%F).sql` |
| Restore database | `psql -U gdn_user portal_gdn < backup.sql` |
| Reset password user | set env `RESET_PASSWORD=email:passwordbaru` di `server/.env` lalu `pm2 restart` (hapus env setelah berhasil) |
| Kosongkan data trial | set `CLEAR_TRIAL_DATA=true` di `.env`, `pm2 restart`, lalu hapus env |

## Catatan penting
- **Port 4000 jangan dibuka ke publik** — biarkan hanya Nginx (80/443) yang
  publik; Node diakses via proxy lokal. (Atur firewall: izinkan 22, 80, 443.)
- **JWT_SECRET & password DB** rahasia — jangan commit `server/.env` ke git
  (sudah ada di `.gitignore`).
- Backend membaca `trust proxy` sehingga IP asli & rate-limit benar di belakang Nginx.
- Struktur kode & alur lengkap: lihat `ARCHITECTURE.md`.
