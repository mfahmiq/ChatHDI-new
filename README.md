This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### NVIDIA API

ChatHDI mendukung model LLM pada NVIDIA API Catalog melalui endpoint OpenAI-compatible.
Simpan API key hanya di `.env` pada server (jangan menggunakan awalan `NEXT_PUBLIC_`):

```env
NVIDIA_API_KEY=nvapi-isi_api_key_anda
NVIDIA_API_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MAX_TOKENS=4096
NVIDIA_REQUESTS_PER_MINUTE=40
NVIDIA_MAX_CONCURRENT_REQUESTS=4
NVIDIA_MAX_QUEUE_SIZE=200
NVIDIA_IMAGE_TIMEOUT_MS=120000
```

Setelah mengubah `.env`, restart development server. Model NVIDIA kemudian dapat dipilih
dari menu model pada kotak chat. Ketersediaan model dan kuota mengikuti akun NVIDIA Anda.

`NVIDIA_MAX_TOKENS` adalah batas maksimum. ChatHDI memilih batas output yang lebih kecil
secara otomatis untuk pertanyaan sederhana, lalu menaikkannya untuk jawaban detail, kode,
atau reasoning. Semua request NVIDIA—chat dan image—melewati antrean FIFO bersama yang
membatasi maksimal 40 request dalam setiap periode 60 detik. Konfigurasi antrean ini
berlaku per proses server; deployment dengan beberapa instance memerlukan rate limiter
bersama seperti Redis agar batasnya tetap global.

Status antrean dapat dipantau melalui `GET /api/health` pada properti `nvidia_queue`.

API key yang sama juga mengaktifkan model text-to-image NVIDIA berikut:

- FLUX.2 Klein 4B (direkomendasikan)
- FLUX.1 Schnell
- FLUX.1 Dev
- Stable Diffusion 3 Medium
- Stable Diffusion XL

Gambar dikirim melalui server ChatHDI; API key NVIDIA tidak pernah diteruskan ke browser.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
