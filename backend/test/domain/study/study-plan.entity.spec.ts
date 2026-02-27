import { StudyPlan } from '../../../src/domain/study/entities/study-plan.entity';
import { PlanStatus } from '../../../src/domain/study/value-objects/plan-status.vo';

describe('StudyPlan', () => {
  // --- create ---

  describe('create', () => {
    it('should create a study plan with active status by default', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Computer Science Degree',
      });

      expect(plan.id).toBe('plan-1');
      expect(plan.userId).toBe('user-1');
      expect(plan.name).toBe('Computer Science Degree');
      expect(plan.description).toBeNull();
      expect(plan.status.value).toBe('active');
      expect(plan.displayOrder).toBe(0);
    });

    it('should accept an optional description', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Math',
        description: 'Algebra and Calculus',
      });

      expect(plan.description).toBe('Algebra and Calculus');
    });

    it('should set createdAt and updatedAt to the same timestamp', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
      });

      expect(plan.createdAt.getTime()).toBe(plan.updatedAt.getTime());
    });
  });

  // --- isOwnedBy ---

  describe('isOwnedBy', () => {
    it('should return true for the owner userId', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'My Plan',
      });

      expect(plan.isOwnedBy('user-1')).toBe(true);
    });

    it('should return false for a different userId', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'My Plan',
      });

      expect(plan.isOwnedBy('user-2')).toBe(false);
    });
  });

  // --- update ---

  describe('update', () => {
    it('should update the name', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Old Name',
      });

      plan.update({ name: 'New Name' });

      expect(plan.name).toBe('New Name');
    });

    it('should update the description', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
        description: 'Old desc',
      });

      plan.update({ description: 'New description' });

      expect(plan.description).toBe('New description');
    });

    it('should allow clearing the description to null', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
        description: 'Has description',
      });

      plan.update({ description: null });

      expect(plan.description).toBeNull();
    });

    it('should update the status', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
      });

      plan.update({ status: PlanStatus.ARCHIVED });

      expect(plan.status.value).toBe('archived');
    });

    it('should update displayOrder', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
      });

      plan.update({ displayOrder: 5 });

      expect(plan.displayOrder).toBe(5);
    });

    it('should only update provided fields and leave others unchanged', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Original',
        description: 'Original desc',
      });

      plan.update({ name: 'Updated' });

      expect(plan.name).toBe('Updated');
      expect(plan.description).toBe('Original desc');
      expect(plan.status.value).toBe('active');
    });

    it('should update the updatedAt timestamp', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
      });
      const originalUpdatedAt = plan.updatedAt;

      plan.update({ name: 'Changed' });

      expect(plan.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });
  });

  // --- fromPersistence ---

  describe('fromPersistence', () => {
    it('should reconstitute a plan from persistence data', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-02-01');

      const plan = StudyPlan.fromPersistence({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Restored Plan',
        description: 'From DB',
        status: PlanStatus.COMPLETED,
        displayOrder: 3,
        createdAt,
        updatedAt,
      });

      expect(plan.id).toBe('plan-1');
      expect(plan.name).toBe('Restored Plan');
      expect(plan.status.value).toBe('completed');
      expect(plan.displayOrder).toBe(3);
      expect(plan.createdAt).toEqual(createdAt);
      expect(plan.updatedAt).toEqual(updatedAt);
    });
  });

  // --- toJSON ---

  describe('toJSON', () => {
    it('should serialize status as a string, not a PlanStatus object', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
      });

      const json = plan.toJSON();

      expect(json.status).toBe('active');
      expect(typeof json.status).toBe('string');
    });

    it('should include all expected fields', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'My Plan',
        description: 'A description',
      });

      const json = plan.toJSON();

      expect(json).toEqual(
        expect.objectContaining({
          id: 'plan-1',
          userId: 'user-1',
          name: 'My Plan',
          description: 'A description',
          status: 'active',
          displayOrder: 0,
        }),
      );
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });

    it('should produce clean JSON via JSON.stringify (no Value Object wrappers)', () => {
      const plan = StudyPlan.create({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Plan',
      });

      const stringified = JSON.stringify(plan.toJSON());
      const parsed = JSON.parse(stringified);

      expect(parsed.status).toBe('active');
      expect(typeof parsed.status).toBe('string');
    });
  });
});
