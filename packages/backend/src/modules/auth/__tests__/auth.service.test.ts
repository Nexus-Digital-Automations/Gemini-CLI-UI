import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../auth.service.js';
import { db } from '../../../db/index.js';
import { users, refreshTokens } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const input = {
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      const result = await authService.register(input);

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify password is hashed
      const [user] = await db.select().from(users).where(eq(users.username, 'testuser'));
      expect(user.passwordHash).not.toBe(input.password);
      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should reject duplicate usernames', async () => {
      const input = {
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      await authService.register(input);

      await expect(authService.register(input)).rejects.toThrow('Username already exists');
    });

    it('should store refresh token in database', async () => {
      const input = {
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      const result = await authService.register(input);

      const tokens = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, result.user.id));

      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toBe(result.refreshToken);
      expect(tokens[0].revokedAt).toBeNull();
    });

    it('should reject weak passwords', async () => {
      const input = {
        username: 'testuser',
        password: 'weak',
      };

      await expect(authService.register(input)).rejects.toThrow();
    });

    it('should reject invalid usernames', async () => {
      const input = {
        username: 'ab',
        password: 'SecurePassword123!',
      };

      await expect(authService.register(input)).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        username: 'testuser',
        password: 'SecurePassword123!',
      });
    });

    it('should authenticate valid credentials', async () => {
      const input = {
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      const result = await authService.login(input);

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject invalid username', async () => {
      const input = {
        username: 'nonexistent',
        password: 'SecurePassword123!',
      };

      await expect(authService.login(input)).rejects.toThrow('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const input = {
        username: 'testuser',
        password: 'WrongPassword123!',
      };

      await expect(authService.login(input)).rejects.toThrow('Invalid credentials');
    });

    it('should generate new refresh token on login', async () => {
      const firstLogin = await authService.login({
        username: 'testuser',
        password: 'SecurePassword123!',
      });

      const secondLogin = await authService.login({
        username: 'testuser',
        password: 'SecurePassword123!',
      });

      expect(firstLogin.refreshToken).not.toBe(secondLogin.refreshToken);
    });

    it('should reject inactive users', async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, 'testuser'));

      await db.update(users).set({ isActive: false }).where(eq(users.id, user.id));

      await expect(
        authService.login({
          username: 'testuser',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshAccessToken', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        username: 'testuser',
        password: 'SecurePassword123!',
      });
      refreshToken = result.refreshToken;
      userId = result.user.id;
    });

    it('should generate new access token with valid refresh token', async () => {
      const result = await authService.refreshAccessToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(userId);
    });

    it('should rotate refresh token', async () => {
      const result = await authService.refreshAccessToken(refreshToken);

      expect(result.refreshToken).not.toBe(refreshToken);

      // Old token should be revoked
      const [oldToken] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));

      expect(oldToken.revokedAt).not.toBeNull();
    });

    it('should reject revoked refresh token', async () => {
      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow(
        'Invalid or revoked refresh token'
      );
    });

    it('should reject invalid refresh token', async () => {
      await expect(authService.refreshAccessToken('invalid-token')).rejects.toThrow();
    });

    it('should reject access token as refresh token', async () => {
      const result = await authService.login({
        username: 'testuser',
        password: 'SecurePassword123!',
      });

      await expect(authService.refreshAccessToken(result.accessToken)).rejects.toThrow(
        'Invalid token type'
      );
    });
  });

  describe('revokeRefreshToken', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const result = await authService.register({
        username: 'testuser',
        password: 'SecurePassword123!',
      });
      refreshToken = result.refreshToken;
    });

    it('should revoke refresh token', async () => {
      await authService.revokeRefreshToken(refreshToken);

      const [token] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));

      expect(token.revokedAt).not.toBeNull();
    });

    it('should prevent reuse of revoked token', async () => {
      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow(
        'Invalid or revoked refresh token'
      );
    });
  });
});
