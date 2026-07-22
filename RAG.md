# ChatHDI RAG

ChatHDI menggunakan satu model embedding lokal (`embeddinggemma`, 384 dimensi) untuk dua sumber retrieval:

- `knowledge/index/company-index.json` untuk RAG offline.
- Supabase `document_sections.embedding_v2` untuk dokumen pribadi dan knowledge bersama.

## Memperbarui knowledge offline

Edit `knowledge/company.md`, lalu jalankan:

```powershell
npm run rag:index-company
```

Index menyimpan hash sumber. Jika Markdown berubah tetapi index belum diperbarui, retrieval akan dilewati dengan pesan yang menjelaskan perintah di atas.

## Mengaktifkan RAG Supabase

Jalankan isi file berikut melalui Supabase SQL Editor:

```text
supabase/migrations/20260722_rag_v2.sql
```

Migration mempertahankan kolom embedding lama dan menambahkan `embedding_v2 vector(384)`, RPC `match_document_sections_v2`, HNSW index, dan RLS.

Setelah migration diterapkan, upload ulang dokumen atau index ulang dokumen lama dari sesi pengguna yang sedang login:

```javascript
const { data: { session } } = await supabase.auth.getSession();

await fetch('/api/rag/reindex', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});
```

Endpoint reindex hanya dapat membaca dan memperbarui baris yang diizinkan oleh RLS untuk pengguna tersebut.

## Alur request

1. Browser mengirim pertanyaan dan access token Supabase ke `/api/chat`.
2. Server membuat satu embedding melalui Ollama.
3. Embedding yang sama dipakai untuk pencarian index lokal dan RPC Supabase.
4. Maksimal enam chunk terbaik dimasukkan sebagai context.
5. Qwen menghasilkan jawaban dan API mengembalikan metadata `rag_sources`.

Semua pembuatan embedding dijalankan pada komputer lokal melalui Ollama. Dokumen hanya dikirim ke Supabase ketika pengguna memilih upload dokumen.
