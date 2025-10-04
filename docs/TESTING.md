# 🧪 Testing Guide - Chatbot Microservice

Panduan lengkap untuk menjalankan testing aplikasi micro-chatbot di lingkungan Docker.

## 📋 Prerequisites

Sebelum menjalankan testing, pastikan Anda memiliki:

- ✅ Docker (version 20.10+)
- ✅ Docker Compose (version 2.0+)
- ✅ Bun runtime (optional, untuk development lokal)
- ✅ File `.env` dengan konfigurasi yang benar

## 🚀 Quick Start

### 1. Cek Port yang Tersedia

Sebelum menjalankan container, cek apakah port yang dibutuhkan tersedia:

```bash
./check-ports.sh
```

Output yang diharapkan:
```
✓ Port 3007 (Chatbot Application) is AVAILABLE
✓ Port 5435 (PostgreSQL Database) is AVAILABLE
```

Jika port sudah digunakan, script akan memberikan saran port alternatif.

### 2. Jalankan Testing Lengkap

Untuk menjalankan testing lengkap dengan report otomatis:

```bash
./run-tests.sh
```

Script ini akan:
1. ✅ Cek ketersediaan port
2. ✅ Stop container yang sedang berjalan
3. ✅ Build Docker images
4. ✅ Start containers
5. ✅ Tunggu services siap
6. ✅ Jalankan API tests
7. ✅ Generate testing report (`testing-result.md`)

### 3. Jalankan Testing Manual

Jika Anda ingin kontrol lebih detail:

#### a. Build Docker Images
```bash
docker compose -f docker-compose.test.yml build
```

#### b. Start Containers
```bash
docker compose -f docker-compose.test.yml up -d
```

#### c. Tunggu Services Siap
```bash
# Tunggu 10-15 detik untuk database dan aplikasi siap
sleep 15
```

#### d. Jalankan API Tests
```bash
./test-api.sh
```

#### e. Stop Containers
```bash
# Stop tanpa menghapus volume
docker compose -f docker-compose.test.yml down

# Stop dan hapus volume (clean slate)
docker compose -f docker-compose.test.yml down -v
```

## 📁 File Structure

```
.
├── Dockerfile.dev              # Dockerfile untuk development dengan hot reload
├── docker-compose.test.yml     # Docker Compose untuk testing environment
├── check-ports.sh              # Script untuk cek ketersediaan port
├── test-api.sh                 # Script untuk testing API endpoints
├── run-tests.sh                # Script untuk menjalankan testing lengkap
├── testing-result.md           # Hasil testing (generated)
└── TESTING.md                  # Panduan ini
```

## 🔧 Configuration

### Port Configuration

Default ports yang digunakan:
- **Application**: 3007 (host) → 3000 (container)
- **PostgreSQL**: 5435 (host) → 5432 (container)

Untuk mengubah port, edit file `docker-compose.test.yml`:

```yaml
services:
  postgres:
    ports:
      - "5435:5432"  # Ubah port host di sini
  
  chatbot-app:
    ports:
      - "3007:3000"  # Ubah port host di sini
```

### Environment Variables

Pastikan file `.env` berisi:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (akan di-override oleh docker-compose)
DATABASE_URL=postgresql://chatbot_user:chatbot_password@localhost:5433/chatbot_service

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
```

## 🧪 Test Coverage

Script `test-api.sh` menguji 9 endpoints:

1. ✅ **GET /health** - Health check
2. ✅ **GET /** - API information
3. ✅ **POST /v1/chatbot/conversations** - Create conversation
4. ✅ **GET /v1/chatbot/conversations** - List conversations
5. ✅ **GET /v1/chatbot/conversations/:id** - Get conversation details
6. ✅ **POST /v1/chatbot/conversations/:id/messages** - Send message
7. ✅ **PATCH /v1/chatbot/conversations/:id** - Update conversation
8. ✅ **POST /v1/chatbot/messages/:id/regenerate** - Regenerate message
9. ✅ **DELETE /v1/chatbot/conversations/:id** - Delete conversation

## 🐳 Docker Commands

### Useful Docker Commands

```bash
# Lihat status containers
docker compose -f docker-compose.test.yml ps

# Lihat logs aplikasi
docker compose -f docker-compose.test.yml logs chatbot-app

# Lihat logs database
docker compose -f docker-compose.test.yml logs postgres

# Follow logs real-time
docker compose -f docker-compose.test.yml logs -f

# Restart service tertentu
docker compose -f docker-compose.test.yml restart chatbot-app

# Rebuild image tanpa cache
docker compose -f docker-compose.test.yml build --no-cache

# Masuk ke container
docker compose -f docker-compose.test.yml exec chatbot-app sh
docker compose -f docker-compose.test.yml exec postgres psql -U chatbot_user -d chatbot_service
```

### Volume Management

```bash
# List volumes
docker volume ls | grep micro-chatbot

# Inspect volume
docker volume inspect micro-chatbot_postgres_test_data

# Remove volume (hati-hati, data akan hilang!)
docker volume rm micro-chatbot_postgres_test_data
```

## 🔍 Troubleshooting

### Port Already in Use

**Problem**: Port 3007 atau 5435 sudah digunakan

**Solution**:
1. Jalankan `./check-ports.sh` untuk melihat port yang tersedia
2. Edit `docker-compose.test.yml` untuk menggunakan port alternatif
3. Atau stop service yang menggunakan port tersebut

### Container Fails to Start

**Problem**: Container gagal start atau unhealthy

**Solution**:
```bash
# Cek logs untuk error
docker compose -f docker-compose.test.yml logs

# Rebuild image
docker compose -f docker-compose.test.yml build --no-cache

# Start ulang dengan clean slate
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d
```

### Database Connection Error

**Problem**: Aplikasi tidak bisa connect ke database

**Solution**:
```bash
# Cek database health
docker compose -f docker-compose.test.yml ps

# Cek database logs
docker compose -f docker-compose.test.yml logs postgres

# Test connection manual
docker compose -f docker-compose.test.yml exec postgres \
  psql -U chatbot_user -d chatbot_service -c "SELECT 1;"
```

### OpenRouter API Error

**Problem**: AI responses gagal

**Solution**:
1. Cek API key di file `.env`
2. Verifikasi API key masih valid
3. Cek quota/limit di OpenRouter dashboard
4. Coba model alternatif

### Test Script Permission Denied

**Problem**: `./test-api.sh: Permission denied`

**Solution**:
```bash
chmod +x check-ports.sh test-api.sh run-tests.sh
```

## 📊 Monitoring

### Health Checks

Aplikasi memiliki built-in health check:

```bash
# Manual health check
curl http://localhost:3007/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-04T12:00:00.000Z","environment":"development"}
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats chatbot-app-test chatbot-postgres-test

# Monitor logs real-time
docker compose -f docker-compose.test.yml logs -f --tail=100
```

## 🎯 Best Practices

### Before Testing
1. ✅ Selalu cek port availability dengan `./check-ports.sh`
2. ✅ Pastikan `.env` file sudah dikonfigurasi dengan benar
3. ✅ Stop container lama jika ada: `docker compose -f docker-compose.test.yml down -v`

### During Testing
1. ✅ Monitor logs untuk error: `docker compose -f docker-compose.test.yml logs -f`
2. ✅ Tunggu services fully ready sebelum run tests (10-15 detik)
3. ✅ Simpan test output untuk reference

### After Testing
1. ✅ Review `testing-result.md` untuk hasil lengkap
2. ✅ Stop containers jika tidak digunakan
3. ✅ Backup database jika ada data penting
4. ✅ Clean up volumes jika tidak diperlukan

## 🔄 Continuous Integration

Untuk CI/CD pipeline, gunakan script berikut:

```bash
#!/bin/bash
set -e

# Run tests
./check-ports.sh
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml build
docker compose -f docker-compose.test.yml up -d
sleep 20
./test-api.sh

# Cleanup
docker compose -f docker-compose.test.yml down -v
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Documentation](https://bun.sh/docs)
- [ElysiaJS Documentation](https://elysiajs.com/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)

## 🆘 Support

Jika mengalami masalah:

1. Cek `testing-result.md` untuk hasil testing terakhir
2. Review logs: `docker compose -f docker-compose.test.yml logs`
3. Cek troubleshooting section di atas
4. Buat issue di repository dengan:
   - Output dari `./check-ports.sh`
   - Output dari `docker compose -f docker-compose.test.yml ps`
   - Relevant logs
   - Steps to reproduce

---

**Last Updated**: 2025-10-04  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

