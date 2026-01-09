# 🚀 ChatHDI Deployment Guide

Panduan lengkap untuk deploy ChatHDI ke Render (Backend) dan Vercel (Frontend).

## 📋 Prasyarat

1. Akun [GitHub](https://github.com) - untuk host kode
2. Akun [Render](https://render.com) - untuk backend (gratis)
3. Akun [Vercel](https://vercel.com) - untuk frontend (gratis)
4. API Keys yang diperlukan:
   - [Groq API](https://console.groq.com/keys) - **Wajib** (untuk chat AI)
   - [Hugging Face](https://huggingface.co/settings/tokens) - **Wajib** (untuk image generation)
   - [Google Gemini API](https://aistudio.google.com/apikey) - Opsional

---

## 🔧 Langkah 1: Push ke GitHub

```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit - ChatHDI deployment ready"

# Buat repository baru di GitHub, lalu:
git remote add origin https://github.com/USERNAME/chathdi.git
git branch -M main
git push -u origin main
```

---

## 🖥️ Langkah 2: Deploy Backend ke Render

### A. Buat Web Service Baru

1. Login ke [Render Dashboard](https://dashboard.render.com)
2. Klik **"New +"** → **"Web Service"**
3. Connect ke GitHub repository Anda
4. Pilih repository `chathdi`

### B. Konfigurasi Service

| Setting | Value |
|---------|-------|
| **Name** | `chathdi-backend` |
| **Region** | Singapore (atau terdekat) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

### C. Set Environment Variables

Di bagian **"Environment"**, tambahkan:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | *(API key Groq Anda)* - **Wajib** |
| `HUGGINGFACE_API_KEY` | *(API key HuggingFace Anda)* - **Wajib** |
| `GEMINI_API_KEY` | *(API key Gemini Anda)* - Opsional |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `DB_NAME` | `chathdi` |

> ⚠️ **Penting**: Setelah deploy frontend, update `CORS_ORIGINS` dengan URL frontend yang benar!

### D. Deploy

1. Klik **"Create Web Service"**
2. Tunggu proses build (3-5 menit)
3. Setelah selesai, catat URL backend Anda:
   - Contoh: `https://chathdi-backend.onrender.com`

### E. Test Backend

Buka browser dan akses:
```
https://chathdi-backend.onrender.com/api/health
```

Response yang diharapkan:
```json
{
  "status": "healthy",
  "version": "2.3.0",
  "mode": "demo"
}
```

---

## 🌐 Langkah 3: Deploy Frontend ke Vercel

### A. Import Project

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **"Add New..."** → **"Project"**
3. Import repository GitHub `chathdi`

### B. Konfigurasi Project

| Setting | Value |
|---------|-------|
| **Project Name** | `chathdi` |
| **Framework Preset** | Create React App |
| **Root Directory** | `frontend` |
| **Build Command** | `yarn build` atau `npm run build` |
| **Output Directory** | `build` |

### C. Set Environment Variables

Di bagian **"Environment Variables"**, tambahkan:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://chathdi-backend.onrender.com/api` |

> **Ganti** dengan URL backend Render Anda dari langkah sebelumnya!

### D. Deploy

1. Klik **"Deploy"**
2. Tunggu proses build (2-3 menit)
3. Setelah selesai, Anda mendapat URL:
   - Contoh: `https://chathdi.vercel.app`

---

## 🔄 Langkah 4: Update CORS di Backend

Setelah frontend berhasil deploy:

1. Kembali ke Render Dashboard
2. Buka service `chathdi-backend`
3. Pergi ke **Environment**
4. Update `CORS_ORIGINS` dengan URL frontend Vercel:
   ```
   https://chathdi.vercel.app,https://your-custom-domain.com
   ```
5. Render akan otomatis redeploy

---

## ✅ Langkah 5: Verifikasi

1. Buka URL frontend Vercel Anda
2. Coba kirim pesan di chat
3. Jika berhasil, deployment selesai! 🎉

---

## 🐛 Troubleshooting

### Backend tidak bisa diakses
- Periksa logs di Render Dashboard
- Pastikan `requirements.txt` lengkap
- Cek environment variables sudah diset

### Frontend tidak konek ke backend
- Periksa `REACT_APP_API_URL` sudah benar
- Pastikan `CORS_ORIGINS` di backend sudah include URL frontend
- Cek browser console untuk error

### API Key error
- Pastikan API key valid dan aktif
- Cek billing/quota di masing-masing provider

### Render free tier sleep
- Free tier akan sleep setelah 15 menit tidak aktif
- Request pertama setelah sleep akan lambat (cold start ~30 detik)
- Solusi: Upgrade ke paid plan atau gunakan uptime monitor

---

## 📁 File yang Dibuat

```
chathdi/
├── backend/
│   ├── render.yaml          # Konfigurasi Render
│   └── .env.example          # Template environment
├── frontend/
│   ├── vercel.json           # Konfigurasi Vercel  
│   ├── .env.example          # Template environment
│   └── src/config.js         # Updated untuk production
└── DEPLOYMENT.md             # Panduan ini
```

---

## 🔗 Links Penting

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google AI Studio**: https://aistudio.google.com
- **Hugging Face**: https://huggingface.co/settings/tokens

---

## 💡 Tips Optimasi

1. **Custom Domain**: Kedua platform support custom domain gratis
2. **Monitoring**: Gunakan Render/Vercel analytics untuk monitor performa
3. **Database**: Untuk production, gunakan MongoDB Atlas (free tier: 512MB)
4. **Caching**: Enable caching di Vercel untuk static assets
