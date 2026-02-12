import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectsService } from '../projects.service.js';
import { db } from '../../../db/index.js';
import { users, projects } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let testUserId: string;
  let testProjectPath: string;

  beforeEach(async () => {
    projectsService = new ProjectsService();

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        username: 'testuser',
        passwordHash: 'hashedpassword',
      })
      .returning();
    testUserId = user.id;

    // Create temporary test directory
    testProjectPath = path.join(os.tmpdir(), `test-project-${Date.now()}`);
    await fs.mkdir(testProjectPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(projects);
    await db.delete(users);

    // Clean up test directory
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const input = {
        name: 'Test Project',
        path: testProjectPath,
      };

      const result = await projectsService.create(testUserId, input);

      expect(result.name).toBe('Test Project');
      expect(result.path).toBe(path.resolve(testProjectPath));
      expect(result.userId).toBe(testUserId);
      expect(result.id).toBeDefined();
    });

    it('should reject non-existent paths', async () => {
      const input = {
        name: 'Test Project',
        path: '/non/existent/path',
      };

      await expect(projectsService.create(testUserId, input)).rejects.toThrow();
    });

    it('should normalize project paths', async () => {
      const input = {
        name: 'Test Project',
        path: testProjectPath + '/..',
      };

      const result = await projectsService.create(testUserId, input);

      expect(result.path).toBe(path.resolve(testProjectPath, '..'));
      expect(result.path).not.toContain('..');
    });

    it('should allow multiple projects for same user', async () => {
      const input1 = {
        name: 'Project 1',
        path: testProjectPath,
      };

      const input2 = {
        name: 'Project 2',
        path: testProjectPath,
      };

      const result1 = await projectsService.create(testUserId, input1);
      const result2 = await projectsService.create(testUserId, input2);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.userId).toBe(result2.userId);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test projects
      await projectsService.create(testUserId, {
        name: 'Project 1',
        path: testProjectPath,
      });
      await projectsService.create(testUserId, {
        name: 'Project 2',
        path: testProjectPath,
      });
    });

    it('should return all projects for user', async () => {
      const result = await projectsService.findAll(testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(testUserId);
      expect(result[1].userId).toBe(testUserId);
    });

    it('should return empty array for user with no projects', async () => {
      const [newUser] = await db
        .insert(users)
        .values({
          username: 'newuser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await projectsService.findAll(newUser.id);

      expect(result).toHaveLength(0);
    });

    it('should not return other users projects', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          username: 'otheruser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await projectsService.findAll(otherUser.id);

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await projectsService.create(testUserId, {
        name: 'Test Project',
        path: testProjectPath,
      });
      projectId = project.id;
    });

    it('should return project by id', async () => {
      const result = await projectsService.findById(testUserId, projectId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(projectId);
      expect(result?.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      const result = await projectsService.findById(testUserId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return other users project', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          username: 'otheruser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await projectsService.findById(otherUser.id, projectId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await projectsService.create(testUserId, {
        name: 'Original Name',
        path: testProjectPath,
      });
      projectId = project.id;
    });

    it('should update project name', async () => {
      const result = await projectsService.update(testUserId, projectId, {
        name: 'Updated Name',
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.path).toBe(path.resolve(testProjectPath));
    });

    it('should update project path', async () => {
      const newPath = path.join(os.tmpdir(), `new-path-${Date.now()}`);
      await fs.mkdir(newPath, { recursive: true });

      const result = await projectsService.update(testUserId, projectId, {
        path: newPath,
      });

      expect(result).toBeDefined();
      expect(result?.path).toBe(path.resolve(newPath));

      await fs.rm(newPath, { recursive: true, force: true });
    });

    it('should reject non-existent paths on update', async () => {
      await expect(
        projectsService.update(testUserId, projectId, {
          path: '/non/existent/path',
        })
      ).rejects.toThrow();
    });

    it('should return null for non-existent project', async () => {
      const result = await projectsService.update(testUserId, 'non-existent-id', {
        name: 'Updated Name',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await projectsService.create(testUserId, {
        name: 'Test Project',
        path: testProjectPath,
      });
      projectId = project.id;
    });

    it('should delete project', async () => {
      const result = await projectsService.delete(testUserId, projectId);

      expect(result).toBe(true);

      const project = await projectsService.findById(testUserId, projectId);
      expect(project).toBeNull();
    });

    it('should return false for non-existent project', async () => {
      const result = await projectsService.delete(testUserId, 'non-existent-id');

      expect(result).toBe(false);
    });

    it('should not delete other users project', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          username: 'otheruser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await projectsService.delete(otherUser.id, projectId);

      expect(result).toBe(false);

      // Verify project still exists
      const project = await projectsService.findById(testUserId, projectId);
      expect(project).toBeDefined();
    });
  });

  describe('getRecent', () => {
    beforeEach(async () => {
      // Create projects with delays to ensure different timestamps
      await projectsService.create(testUserId, {
        name: 'Old Project',
        path: testProjectPath,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await projectsService.create(testUserId, {
        name: 'Recent Project',
        path: testProjectPath,
      });
    });

    it('should return recent projects in descending order', async () => {
      const result = await projectsService.getRecent(testUserId, 5);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Recent Project');
      expect(result[1].name).toBe('Old Project');
    });

    it('should limit results to specified count', async () => {
      const result = await projectsService.getRecent(testUserId, 1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Recent Project');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await projectsService.create(testUserId, {
        name: 'React Project',
        path: testProjectPath,
      });
      await projectsService.create(testUserId, {
        name: 'Vue Application',
        path: testProjectPath,
      });
      await projectsService.create(testUserId, {
        name: 'React Native App',
        path: testProjectPath,
      });
    });

    it('should find projects by name match', async () => {
      const result = await projectsService.search(testUserId, 'React');

      expect(result).toHaveLength(2);
      expect(result.some((p) => p.name === 'React Project')).toBe(true);
      expect(result.some((p) => p.name === 'React Native App')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const result = await projectsService.search(testUserId, 'react');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      const result = await projectsService.search(testUserId, 'Angular');

      expect(result).toHaveLength(0);
    });
  });
});
