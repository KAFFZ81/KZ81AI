# KZ81 AI

Website belajar dan kreativitas dengan AI menggunakan Cloudflare Pages Functions + Cloudflare Workers AI.

## Deployment

1. Hubungkan repository `KAFFZ81/KZ81AI` ke Cloudflare Pages (branch `main`).
2. Framework preset: None.
3. Build command: kosongkan (atau gunakan konfigurasi build yang saat ini bekerja).
4. Build output directory: `.`.
5. Setelah deployment, buka **Workers & Pages → kz81ai → Settings → Bindings**.
6. Pilih **Add → Workers AI**.
7. Isi **Variable name** dengan `AI`, lalu simpan.
8. Pastikan binding tersebut ditambahkan pada environment **Production**. Tambahkan juga ke **Preview** bila ingin menguji preview.
9. Redeploy project agar binding tersedia pada Pages Functions.

## Backend

Endpoint `/api/chat` memakai binding `env.AI` dan model Cloudflare Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

Tidak perlu memasukkan Gemini API key. Jangan pernah menyimpan API key atau token rahasia di file frontend maupun GitHub.

## Catatan penggunaan

Workers AI memiliki alokasi gratis harian dan biaya berdasarkan pemakaian setelah alokasi tersebut. Pantau penggunaan di dashboard Cloudflare sebelum membagikan situs secara luas.
