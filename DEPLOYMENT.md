# 🚀 ChatHDI Deployment Guide

Panduan lengkap untuk deploy ChatHDI ke **Hugging Face Spaces** (Backend) dan **Vercel** (Frontend).

> ✅ **Tidak perlu kartu kredit** - Semua gratis!

## 📋 Prasyarat

1. Akun [GitHub](https://github.com) - untuk host kode
2. Akun [Hugging Face](https://huggingface.co) - untuk backend (gratis)
3. Akun [Vercel](https://vercel.com) - untuk frontend (gratis)
4. API Keys yang diperlukan:
   - [Groq API](https://console.groq.com/keys) - **Wajib** (untuk chat AI)
   - [Hugging Face Token](https://huggingface.co/settings/tokens) - **Wajib** (untuk image generation)
   - [Google Gemini API](https://aistudio.google.com/apikey) - Opsional

---

## 🖥️ Langkah 1: Deploy Backend ke Hugging Face Spaces

### A. Buat Space Baru

1. Login ke [Hugging Face](https://huggingface.co)
2. Klik **Profile** → **New Space**
3. Isi konfigurasi:

| Setting | Value |
|---------|-------|
| **Space name** | `chathdi-api` |
| **License** | MIT |
| **SDK** | Docker |
| **Hardware** | CPU basic (Free) |
| **Visibility** | Public |

4. Klik **Create Space**

### B. Upload Backend Files

**Cara 1: Via Web Interface**
1. Di halaman Space, klik **Files** → **+ Add file** → **Upload files**
2. Upload semua file dari folder `backend/`:
   - `server.py`
   - `ai_service.py`
   - `media_service.py`
   - `pptx_service.py`
   - `rnd_models.py`
   - `requirements.txt`
   - `Dockerfile`
   - `README.md`

**Cara 2: Via Git** (Recommended)
```bash
# Clone Space repository
git clone https://huggingface.co/spaces/YOUR_USERNAME/chathdi-api
cd chathdi-api

# Copy backend files
cp -r /path/to/ChatHDI-new/backend/* .

# Push ke HuggingFace
git add .
git commit -m "Initial backend deployment"
git push
```

### C. Set Environment Variables (Secrets)

1. Di halaman Space, klik **Settings** → **Repository secrets**
2. Tambahkan secrets berikut:

| Secret Name | Value |
|-------------|-------|
| `GROQ_API_KEY` | *(API key Groq Anda)* |
| `HUGGINGFACE_API_KEY` | *(Token HuggingFace Anda)* |
| `GEMINI_API_KEY` | *(Opsional)* |
| `CORS_ORIGINS` | `*` *(sementara, nanti ganti dengan URL Vercel)* |

3. Klik **Save**

### D. Tunggu Build Selesai

1. Kembali ke tab **App**
2. Tunggu proses build (3-5 menit)
3. Setelah selesai, Space akan aktif di:
   ```
   https://YOUR_USERNAME-chathdi-api.hf.space
   ```

### E. Test Backend

Buka browser dan akses:
```
https://YOUR_USERNAME-chathdi-api.hf.space/api/health
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

## 🌐 Langkah 2: Deploy Frontend ke Vercel

### A. Import Project

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **"Add New..."** → **"Project"**
3. Import repository GitHub `mfahmiq/ChatHDI-new`

### B. Konfigurasi Project

| Setting | Value |
|---------|-------|
| **Project Name** | `chathdi` |
| **Framework Preset** | Next.js |
| **Root Directory** | `./` (biarkan kosong / root repository) |
| **Build Command** | `npm run build` |

### C. Set Environment Variables

Di bagian **"Environment Variables"**, tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ziiyznxuxmrrpdnojthc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Anon key Supabase Anda)* |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `GROQ_API_KEY` | *(API key Groq Anda)* |

### D. Deploy

1. Klik **"Deploy"**
2. Tunggu proses build (2-3 menit)
3. Setelah selesai, Anda mendapat URL:
   - Contoh: `https://chathdi.vercel.app`

---

## 🔄 Langkah 3: Update CORS di Backend

Setelah frontend berhasil deploy:

1. Kembali ke HuggingFace Space → **Settings** → **Repository secrets**
2. Update `CORS_ORIGINS` dengan URL frontend Vercel:
   ```
   https://chathdi.vercel.app
   ```
3. **Restart** Space: Settings → Factory reboot

---

## ✅ Langkah 4: Verifikasi

1. Buka URL frontend Vercel Anda
2. Coba kirim pesan di chat
3. Jika berhasil, deployment selesai! 🎉

---

## 🐛 Troubleshooting

### Backend tidak bisa diakses
- Periksa logs di HuggingFace Space → **Logs**
- Pastikan semua file sudah terupload
- Cek secrets sudah diset dengan benar

### Frontend tidak konek ke backend
- Periksa `REACT_APP_API_URL` sudah benar
- Pastikan `CORS_ORIGINS` di backend include URL frontend
- Cek browser console untuk error

### Space stuck di "Building"
- Cek Dockerfile syntax
- Pastikan `requirements.txt` valid
- Coba "Factory reboot" di Settings

### API Key error
- Pastikan API key valid dan aktif
- Untuk HuggingFace token, gunakan "Write" permission

---

## 📁 Struktur Project

```
ChatHDI-new/
├── backend/
│   ├── Dockerfile            # Konfigurasi Docker untuk HF Spaces
│   ├── README.md             # Metadata HuggingFace Space
│   ├── requirements.txt      # Python dependencies
│   ├── server.py             # FastAPI server
│   ├── ai_service.py         # AI chat service
│   ├── media_service.py      # Image/video generation
│   ├── pptx_service.py       # PowerPoint generation
│   ├── rnd_models.py         # R&D database models
│   └── .env.example          # Template environment
├── frontend/
│   ├── vercel.json           # Konfigurasi Vercel
│   ├── package.json          # Node.js dependencies
│   ├── src/
│   │   └── config.js         # API URL configuration
│   └── .env.example          # Template environment
└── DEPLOYMENT.md             # Panduan ini
```

---

## 🔗 Links Penting

- **HuggingFace Spaces**: https://huggingface.co/spaces
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Groq Console**: https://console.groq.com
- **HuggingFace Tokens**: https://huggingface.co/settings/tokens

---

## 💡 Tips

1. **Free Tier Limits**:
   - HuggingFace: CPU basic gratis, bisa sleep setelah tidak aktif
   - Vercel: 100GB bandwidth/bulan

2. **Custom Domain**: Kedua platform support custom domain gratis

3. **Upgrades**:
   - HuggingFace: Upgrade ke GPU untuk response lebih cepat
   - Vercel: Pro plan untuk fitur lebih lengkap
