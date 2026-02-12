import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';

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
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      // First register
      await authService.register({
        username: 'logintest',
        password: 'SecurePassword123!',
      });

      // Then login
      const result = await authService.login({
        username: 'logintest',
        password: 'SecurePassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      await expect(
        authService.login({
          username: 'nonexistent',
          password: 'wrong',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
