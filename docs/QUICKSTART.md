# 🚀 Quick Start Guide

Panduan cepat untuk menjalankan Chatbot Microservice.

## Prerequisites

- Bun >= 1.1.0 ([Install Bun](https://bun.sh))
- Docker & Docker Compose
- OpenRouter API Key ([Get here](https://openrouter.ai/))

## Setup dalam 5 Langkah

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Environment Variables

Edit file `.env` dan masukkan OpenRouter API key Anda:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
```

**Cara mendapatkan API Key:**
1. Kunjungi https://openrouter.ai/
2. Sign up / Login
3. Buka https://openrouter.ai/keys
4. Create new key
5. Copy dan paste ke `.env`

### 3. Start PostgreSQL Database

```bash
docker compose up -d
```

Tunggu beberapa detik hingga database siap. Cek status:

```bash
docker compose ps
```

### 4. Start Application

```bash
bun run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 5. Test API

Buka terminal baru dan jalankan:

```bash
# Test health check
curl http://localhost:3000/health

# Create conversation
curl -X POST http://localhost:3000/v1/chatbot/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-001",
    "title": "Test Chat",
    "initial_message": "Hello! Can you help me?"
  }'
```

## Testing dengan Script

Kami sudah menyediakan script testing lengkap:

```bash
./test-api.sh
```

Script ini akan menjalankan semua endpoint API secara otomatis.

## Troubleshooting

### Database Connection Error

```bash
# Restart database
docker compose restart

# Check logs
docker compose logs -f
```

### Port Already in Use

Jika port 3000 sudah digunakan, ubah di `.env`:

```bash
PORT=3001
```

### OpenRouter API Error

- Pastikan API key valid
- Cek saldo di https://openrouter.ai/credits
- Pastikan model tersedia (default: `openai/gpt-3.5-turbo`)

## Next Steps

- Baca [README.md](README.md) untuk dokumentasi lengkap
- Lihat [chatbot microservice.md](chatbot%20microservice.md) untuk spesifikasi detail
- Customize system instructions di `src/prompts/system-instructions.ts`
- Tambahkan prompt templates di `src/prompts/prompt-templates.ts`

## Stop Services

```bash
# Stop application: Ctrl+C di terminal

# Stop database
docker compose down

# Stop dan hapus data (WARNING: menghapus semua data)
docker compose down -v
```

## Support

Jika ada masalah, cek:
1. Logs aplikasi di terminal
2. Logs database: `docker compose logs postgres`
3. File dokumentasi di repository

