import { User } from '../../../src/domain/user/entities/user.entity';

describe('User', () => {
  // --- create ---

  describe('create', () => {
    it('should create a user with active status and no avatar', () => {
      const user = User.create({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: 'hashed-password-123',
        name: 'John Doe',
      });

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('john@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.avatarUrl).toBeNull();
      expect(user.isActive).toBe(true);
    });

    it('should store the password hash internally', () => {
      const user = User.create({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: '$2b$10$abc123',
        name: 'John',
      });

      expect(user.passwordHash).toBe('$2b$10$abc123');
    });

    it('should set createdAt and updatedAt to the same timestamp', () => {
      const user = User.create({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hash',
        name: 'Test',
      });

      expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
    });
  });

  // --- isOwnedBy ---

  describe('isOwnedBy', () => {
    it('should return true when userId matches', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'A',
      });

      expect(user.isOwnedBy('user-1')).toBe(true);
    });

    it('should return false when userId does not match', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'A',
      });

      expect(user.isOwnedBy('user-2')).toBe(false);
    });
  });

  // --- updateProfile ---

  describe('updateProfile', () => {
    it('should update the name', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'Old Name',
      });

      user.updateProfile({ name: 'New Name' });

      expect(user.name).toBe('New Name');
    });

    it('should update the avatar URL', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'User',
      });

      user.updateProfile({ avatarUrl: 'https://example.com/avatar.png' });

      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('should allow clearing the avatar URL to null', () => {
      const user = User.fromPersistence({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'User',
        avatarUrl: 'https://example.com/avatar.png',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user.updateProfile({ avatarUrl: null });

      expect(user.avatarUrl).toBeNull();
    });

    it('should only update provided fields', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'Original',
      });

      user.updateProfile({ name: 'Updated' });

      expect(user.name).toBe('Updated');
      expect(user.avatarUrl).toBeNull(); // unchanged
    });

    it('should update the updatedAt timestamp', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'User',
      });
      const original = user.updatedAt;

      user.updateProfile({ name: 'Changed' });

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        original.getTime(),
      );
    });
  });

  // --- deactivate / activate ---

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'User',
      });

      user.deactivate();

      expect(user.isActive).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'User',
      });
      const original = user.updatedAt;

      user.deactivate();

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        original.getTime(),
      );
    });
  });

  describe('activate', () => {
    it('should set isActive to true after deactivation', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'hash',
        name: 'User',
      });

      user.deactivate();
      expect(user.isActive).toBe(false);

      user.activate();
      expect(user.isActive).toBe(true);
    });
  });

  // --- fromPersistence ---

  describe('fromPersistence', () => {
    it('should reconstitute a user from persistence data', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-02-01');

      const user = User.fromPersistence({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: 'stored-hash',
        name: 'John',
        avatarUrl: 'https://cdn.example.com/john.jpg',
        isActive: false,
        createdAt,
        updatedAt,
      });

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('john@example.com');
      expect(user.passwordHash).toBe('stored-hash');
      expect(user.avatarUrl).toBe('https://cdn.example.com/john.jpg');
      expect(user.isActive).toBe(false);
      expect(user.createdAt).toEqual(createdAt);
    });
  });

  // --- toJSON ---

  describe('toJSON', () => {
    it('should NOT include passwordHash in the JSON output', () => {
      const user = User.create({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: 'super-secret-hash',
        name: 'John',
      });

      const json = user.toJSON();

      expect(json).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(json)).not.toContain('super-secret-hash');
    });

    it('should include all public fields', () => {
      const user = User.create({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: 'hash',
        name: 'John Doe',
      });

      const json = user.toJSON();

      expect(json).toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          avatarUrl: null,
          isActive: true,
        }),
      );
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });

    it('should produce clean JSON via JSON.stringify', () => {
      const user = User.create({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'secret',
        name: 'A',
      });

      const stringified = JSON.stringify(user.toJSON());
      const parsed = JSON.parse(stringified);

      expect(parsed).not.toHaveProperty('passwordHash');
      expect(parsed.id).toBe('user-1');
      expect(parsed.email).toBe('a@b.com');
      expect(parsed.name).toBe('A');
    });
  });
});
