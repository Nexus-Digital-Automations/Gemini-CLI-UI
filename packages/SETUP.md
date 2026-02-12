# Gemini CLI UI - TypeScript Rewrite Setup Guide

## ✅ Phase 1 Complete: Foundation & Core Infrastructure

This guide will help you set up and run the TypeScript rewrite of Gemini CLI UI.

---

## Prerequisites

- **Node.js:** 20.0.0 or higher
- **npm:** 10.0.0 or higher
- **Git:** For version control

Verify your installations:
```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 10.0.0
```

---

## Quick Start

### 1. Install Dependencies

From the `packages/` directory:

```bash
cd packages
npm install
```

This will install dependencies for all three packages (shared, backend, frontend) using npm workspaces.

### 2. Build Shared Package

The shared package must be built first since both frontend and backend depend on it:

```bash
cd shared
npm run build
```

Or use Turborepo from the packages root:

```bash
npm run build
```

### 3. Configure Backend

Create a `.env` file in `packages/backend/`:

```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed (defaults are fine for development):

```env
NODE_ENV=development
PORT=4010
HOST=localhost
DATABASE_PATH=./data/gemini-ui.db
ALLOWED_ORIGINS=http://localhost:5173
```

**Note:** JWT_SECRET will be auto-generated on first run and saved to `.jwt-secret`

### 4. Initialize Database

Generate and run migrations:

```bash
cd backend

# Generate migration files from schema
npm run db:generate

# Run migrations
npm run db:migrate
```

This creates the SQLite database at `backend/data/gemini-ui.db` with all tables.

### 5. Start Backend Server

```bash
cd backend
npm run dev
```

The server starts at `http://localhost:4010`

You should see:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Gemini CLI UI Backend (TypeScript)                  ║
║                                                           ║
║   Server:  http://localhost:4010                         ║
║   Environment: development                               ║
║   Database: ./data/gemini-ui.db                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 6. Test the API

Test the health endpoint:

```bash
curl http://localhost:4010/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-02-12T...",
  "version": "2.0.0"
}
```

Test user registration:

```bash
curl -X POST http://localhost:4010/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePassword123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clqx...",
    "username": "testuser"
  }
}
```

Test login:

```bash
curl -X POST http://localhost:4010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePassword123!"
  }'
```

---

## Project Structure

```
packages/
├── shared/                      # Shared TypeScript types
│   ├── src/
│   │   ├── types/              # Type definitions
│   │   │   ├── auth.types.ts
│   │   │   ├── api.types.ts
│   │   │   ├── project.types.ts
│   │   │   ├── session.types.ts
│   │   │   ├── file.types.ts
│   │   │   └── git.types.ts
│   │   └── index.ts            # Exports
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # Express TypeScript API
│   ├── src/
│   │   ├── config/             # Configuration
│   │   │   └── index.ts
│   │   ├── db/                 # Database (Drizzle ORM)
│   │   │   ├── schema.ts       # Database schema
│   │   │   ├── index.ts        # DB connection
│   │   │   ├── migrate.ts      # Migration runner
│   │   │   └── migrations/     # Generated migrations
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error-handler.ts
│   │   │   └── rate-limiter.ts
│   │   ├── security/           # Security utilities
│   │   │   ├── jwt.ts          # JWT management
│   │   │   ├── validators.ts   # Input validation
│   │   │   └── file-upload.ts  # File upload security
│   │   ├── modules/            # Feature modules
│   │   │   └── auth/
│   │   │       ├── auth.service.ts
│   │   │       ├── auth.controller.ts
│   │   │       └── auth.routes.ts
│   │   └── server.ts           # Entry point
│   ├── data/                   # SQLite database
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── drizzle.config.ts
│
├── frontend/                    # React TypeScript app (Phase 3)
│   └── (to be implemented)
│
├── package.json                 # Root workspace config
├── turbo.json                   # Turborepo config
└── README.md
```

---

## Development Workflow

### Running All Packages

From `packages/`:

```bash
npm run dev
```

This uses Turborepo to run all packages in parallel.

### Type Checking

Check TypeScript types across all packages:

```bash
npm run type-check
```

### Building for Production

Build all packages:

```bash
npm run build
```

### Cleaning Build Artifacts

```bash
npm run clean
```

---

## What's Implemented (Phase 1)

### ✅ Shared Package
- TypeScript types for auth, API, projects, sessions, files, git
- Zod validation schemas
- Complete type safety between frontend/backend

### ✅ Backend Core
- Express server with TypeScript
- Environment configuration with validation
- Security headers (helmet)
- CORS configuration
- Rate limiting (general + auth-specific)
- Global error handling
- Health check endpoint

### ✅ Database
- Drizzle ORM with SQLite
- Type-safe queries
- Migration system
- Tables: users, sessions, refreshTokens, projects, chatMessages
- Foreign key constraints
- WAL mode for performance

### ✅ Security Modules
- **JWT Management:**
  - Automatic 128-char secret generation
  - Access tokens (7 days)
  - Refresh tokens (30 days)
  - Token verification and rotation

- **Input Validation:**
  - Path normalization and traversal protection
  - Git message sanitization
  - Branch name validation
  - Filename sanitization
  - URL validation
  - Username/password strength validation

- **File Upload Security:**
  - Magic byte validation
  - MIME type verification
  - Image optimization
  - Safe filename generation
  - Size limits (10MB default)

### ✅ Authentication Module
- **Service Layer:**
  - User registration with bcrypt (12 rounds)
  - Login with credential validation
  - Token refresh with rotation
  - Logout (token revocation)
  - Token cleanup utilities

- **Controller Layer:**
  - Request validation (Zod)
  - Error handling with specific codes
  - HTTP status codes

- **Routes:**
  - POST /api/auth/register (rate-limited)
  - POST /api/auth/login (rate-limited)
  - POST /api/auth/refresh
  - POST /api/auth/logout

- **Middleware:**
  - requireAuth() - Protect routes
  - optionalAuth() - Conditional auth

---

## Security Features

### Built-In Protection

1. **JWT Security:**
   - Cryptographically secure 128-char secrets
   - Automatic expiration (7d access, 30d refresh)
   - Token rotation on refresh
   - Database-backed revocation

2. **Input Validation:**
   - All inputs validated with Zod schemas
   - Path traversal protection
   - Shell metacharacter stripping
   - HTML escaping

3. **Rate Limiting:**
   - 100 requests/min (API)
   - 5 attempts/15min (auth)
   - 10 uploads/15min

4. **Headers:**
   - Content Security Policy
   - XSS Protection
   - Frameguard
   - HSTS

5. **Password Security:**
   - bcrypt with 12 rounds
   - Minimum 8 characters
   - Strength validation available

6. **File Uploads:**
   - Magic byte verification
   - MIME type validation
   - No SVG (XSS risk)
   - Size limits

---

## Next Steps (Phase 2-5)

### Phase 2: Backend Modules (Weeks 2-3)
- Projects module (CRUD operations)
- Sessions module (chat history)
- Files module (read/write with validation)
- Git module (status, commit, branch)
- Gemini CLI integration
- WebSocket server (real-time chat)

### Phase 3: Frontend (Weeks 4-5)
- React 19 + Vite setup
- TanStack Router & Query
- Zustand state management
- Authentication UI
- Chat interface
- File explorer with CodeMirror
- Terminal UI with xterm.js

### Phase 4: Testing (Week 6)
- Unit tests (Vitest)
- Integration tests (Supertest)
- Component tests (React Testing Library)
- E2E tests (Playwright)
- >80% coverage target

### Phase 5: Tooling & Docs (Week 7-8)
- ESLint 9 configuration
- Prettier setup
- Husky pre-commit hooks
- GitHub Actions CI/CD
- Comprehensive documentation

---

## Troubleshooting

### Database Issues

**Error: Cannot find module './data/gemini-ui.db'**

Solution: Run migrations
```bash
cd backend
npm run db:migrate
```

**Error: Database is locked**

Solution: Close other connections or delete lock files
```bash
rm backend/data/gemini-ui.db-shm
rm backend/data/gemini-ui.db-wal
```

### TypeScript Issues

**Error: Cannot find module '@gemini-ui/shared'**

Solution: Build shared package first
```bash
cd shared
npm run build
```

**Error: Type errors in strict mode**

Solution: Run type-check to see all errors
```bash
npm run type-check
```

### JWT Issues

**Error: JWT_SECRET too short**

Solution: Delete `.jwt-secret` and restart server (new one will be generated)
```bash
rm backend/.jwt-secret
npm run dev
```

### Port Already in Use

**Error: Port 4010 already in use**

Solution: Change port in `.env` or kill existing process
```bash
# Change port
PORT=4011

# Or kill process
lsof -ti:4010 | xargs kill -9
```

---

## API Reference

### Authentication

#### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "username": "string (3-50 chars, alphanumeric + _ -)",
  "password": "string (8-100 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "username": "string"
  }
}
```

**Errors:**
- 400: Validation error
- 409: Username already exists
- 429: Rate limit exceeded

#### POST /api/auth/login

Login to existing account.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):** Same as register

**Errors:**
- 401: Invalid credentials
- 429: Rate limit exceeded

#### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):** Same as register

**Errors:**
- 401: Invalid or expired refresh token

#### POST /api/auth/logout

Revoke refresh token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Contributing

When implementing new features:

1. **Define types in `shared/` first**
2. **Create Zod schemas for validation**
3. **Follow the auth module pattern:**
   - Service layer (business logic)
   - Controller layer (HTTP handling)
   - Routes (endpoint definitions)
4. **Add tests** (unit + integration)
5. **Update this documentation**

---

## License

MIT

---

## Support

For issues or questions:
1. Check this documentation
2. Review existing code in `modules/auth/`
3. Check TypeScript errors with `npm run type-check`
4. Open an issue on GitHub
