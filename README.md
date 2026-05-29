# Portal GDN — Siap Deploy ke Vercel

Proyek React (Vite) ini sudah berisi file `portal gdn versi dummy final.jsx` Anda
(ada di `src/App.jsx`). Sudah dites build dan jalan normal.

## Cara deploy lewat browser (tanpa install apa pun)

### 1. Buat repo baru di GitHub
- Buka https://github.com/new
- Beri nama, misal `portal-gdn`
- Pilih **Public** (atau Private, sama saja untuk Vercel)
- Klik **Create repository**

### 2. Upload semua file proyek ini
- Di halaman repo baru, klik **"uploading an existing file"**
  (atau tab **Add file > Upload files**)
- Drag SEMUA isi folder ini ke sana, TERMASUK folder `src`
  (JANGAN upload folder `node_modules` atau `dist` — keduanya tidak ada di zip ini)
- Klik **Commit changes**

### 3. Deploy di Vercel
- Buka https://vercel.com/new
- Klik **Continue with GitHub** → pilih repo `portal-gdn`
- Vercel otomatis mendeteksi Vite. Biarkan setelan default.
- Klik **Deploy**
- Tunggu ~1 menit → dapat URL seperti `portal-gdn.vercel.app`

Link itu bisa langsung Anda bagikan ke siapa saja lewat WA. 🎉

## Kalau pakai laptop dengan Node.js terpasang
```
npm install
npm run dev      # tes di localhost
npm run build    # build produksi
```
