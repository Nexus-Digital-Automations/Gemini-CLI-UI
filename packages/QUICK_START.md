# Quick Start - Gemini CLI UI TypeScript Rewrite

**Phase 1 Complete!** ✅ Foundation & authentication ready to test.

---

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies (2 minutes)

```bash
cd packages
npm install
```

### 2. Build Shared Package (30 seconds)

```bash
cd shared
npm run build
cd ..
```

### 3. Setup Backend (1 minute)

```bash
cd backend

# Copy environment config
cp .env.example .env

# Initialize database
npm run db:generate
npm run db:migrate
```

### 4. Start Server (30 seconds)

```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║   🚀 Gemini CLI UI Backend (TypeScript)                  ║
║   Server:  http://localhost:4010                         ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ✅ Test Authentication (2 minutes)

### Test 1: Health Check

```bash
curl http://localhost:4010/health
```

Expected:
```json
{"success":true,"status":"healthy","timestamp":"...","version":"2.0.0"}
```

### Test 2: Register User

```bash
curl -X POST http://localhost:4010/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"SecurePass123!"}'
```

Expected:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "eyJhbGciOiJI...",
  "user": {
    "id": "clqx...",
    "username": "testuser"
  }
}
```

Save the `accessToken` for next test!

### Test 3: Login

```bash
curl -X POST http://localhost:4010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"SecurePass123!"}'
```

Expected: Same as registration response

### Test 4: Protected Route (requires token)

```bash
# Replace YOUR_ACCESS_TOKEN with token from Test 2
curl http://localhost:4010/api/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test 5: Rate Limiting

Try registering 6 times in a row (5 is the limit):

```bash
for i in {1..6}; do
  curl -X POST http://localhost:4010/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"password\":\"SecurePass123!\"}"
  echo ""
done
```

The 6th attempt should return:
```json
{
  "success": false,
  "error": "Too many authentication attempts...",
  "code": "AUTH_RATE_LIMIT_EXCEEDED"
}
```

---

## 📂 What's Available Now

### ✅ API Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/health` | Health check | None |
| POST | `/api/auth/register` | Register new user | 5/15min |
| POST | `/api/auth/login` | Login user | 5/15min |
| POST | `/api/auth/refresh` | Refresh access token | 100/min |
| POST | `/api/auth/logout` | Logout (revoke token) | 100/min |

### ✅ Security Features

- ✅ JWT with 128-char auto-generated secret
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting on all endpoints
- ✅ Input validation with Zod
- ✅ Security headers (helmet + CSP)
- ✅ CORS protection
- ✅ Token expiration (7d access, 30d refresh)

### ✅ Database Tables

- `users` - User accounts with password hashes
- `sessions` - Chat sessions with Gemini
- `refresh_tokens` - Refresh token management
- `projects` - Project metadata
- `chat_messages` - Chat history

---

## 🔧 Development Commands

```bash
# Start backend in watch mode
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Generate database migration
npm run db:generate

# Run migrations
npm run db:migrate
```

---

## 📁 Key Files to Know

```
packages/
├── shared/src/types/         # TypeScript types (modify these first!)
│   ├── auth.types.ts
│   ├── api.types.ts
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── server.ts         # Main entry point
│   │   ├── config/index.ts   # Environment config
│   │   ├── db/schema.ts      # Database schema
│   │   ├── security/         # JWT, validation, file upload
│   │   └── modules/auth/     # Auth module (pattern for others)
│   │
│   ├── .env                  # Your config
│   ├── data/gemini-ui.db     # SQLite database
│   └── .jwt-secret           # Auto-generated JWT secret
```

---

## 🐛 Troubleshooting

### Port 4010 already in use?

```bash
# Change port in .env
echo "PORT=4011" >> backend/.env

# Or kill existing process
lsof -ti:4010 | xargs kill -9
```

### Database locked?

```bash
rm backend/data/gemini-ui.db-shm
rm backend/data/gemini-ui.db-wal
```

### Type errors?

```bash
# Make sure shared package is built
cd shared && npm run build
cd ../backend && npm run type-check
```

### JWT secret error?

```bash
# Delete and regenerate
rm backend/.jwt-secret
npm run dev  # New secret generated automatically
```

---

## 🎯 What's Next?

Phase 1 is complete! Next up:

1. **Phase 2 - Backend Modules:**
   - Projects CRUD
   - Sessions management
   - File operations
   - Git integration
   - Gemini CLI wrapper
   - WebSocket server

2. **Phase 3 - Frontend:**
   - React 19 + Vite
   - Authentication UI
   - Chat interface
   - File explorer
   - Terminal

See `IMPLEMENTATION_STATUS.md` for full roadmap.

---

## 💡 Development Tips

1. **Always define types in `shared/` first** before implementing features
2. **Follow the auth module pattern** (service → controller → routes)
3. **Use Zod for all validation** (runtime safety)
4. **Check type safety** with `npm run type-check`
5. **Test API endpoints** with curl or Postman as you build

---

## 📚 Full Documentation

- `SETUP.md` - Complete setup guide
- `IMPLEMENTATION_STATUS.md` - Project status & roadmap
- `README.md` - Architecture overview

---

**Ready to build!** The foundation is solid and secure. 🚀
