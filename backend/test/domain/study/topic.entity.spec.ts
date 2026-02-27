import { Topic } from '../../../src/domain/study/entities/topic.entity';
import { TopicStatus } from '../../../src/domain/study/value-objects/topic-status.vo';

describe('Topic', () => {
  // --- create ---

  describe('create', () => {
    it('should create a topic with not_started status and zero mastery', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Binary Trees',
      });

      expect(topic.id).toBe('topic-1');
      expect(topic.subjectId).toBe('subject-1');
      expect(topic.name).toBe('Binary Trees');
      expect(topic.description).toBeNull();
      expect(topic.status.value).toBe('not_started');
      expect(topic.masteryLevel).toBe(1);
      expect(topic.systemMasteryLevel).toBe(0);
      expect(topic.displayOrder).toBe(0);
    });

    it('should accept optional description', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Sorting Algorithms',
        description: 'Quicksort, mergesort, heapsort',
      });

      expect(topic.description).toBe('Quicksort, mergesort, heapsort');
    });
  });

  // --- markInProgress ---

  describe('markInProgress', () => {
    it('should transition from not_started to in_progress', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.markInProgress();

      expect(topic.status.value).toBe('in_progress');
    });

    it('should not change status if already in_progress', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.markInProgress();
      const updatedAtAfterFirst = topic.updatedAt;

      // Calling again should be a no-op
      topic.markInProgress();

      expect(topic.status.value).toBe('in_progress');
      // updatedAt should not change on a no-op
      expect(topic.updatedAt).toEqual(updatedAtAfterFirst);
    });

    it('should not transition from mastered back to in_progress', () => {
      const topic = Topic.fromPersistence({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
        description: null,
        masteryLevel: 1,
        systemMasteryLevel: 9,
        status: TopicStatus.MASTERED,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      topic.markInProgress();

      expect(topic.status.value).toBe('mastered'); // should not change
    });
  });

  // --- updateSystemMastery ---

  describe('updateSystemMastery', () => {
    it('should update the system mastery level and status', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.updateSystemMastery(5.5, TopicStatus.IN_PROGRESS);

      expect(topic.systemMasteryLevel).toBe(5.5);
      expect(topic.status.value).toBe('in_progress');
    });

    it('should transition to mastered when given mastered status', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.updateSystemMastery(9.0, TopicStatus.MASTERED);

      expect(topic.systemMasteryLevel).toBe(9.0);
      expect(topic.status.value).toBe('mastered');
    });

    it('should update updatedAt timestamp', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });
      const before = topic.updatedAt;

      topic.updateSystemMastery(3.0, TopicStatus.IN_PROGRESS);

      expect(topic.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  // --- update ---

  describe('update', () => {
    it('should update the name', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Old',
      });

      topic.update({ name: 'New' });

      expect(topic.name).toBe('New');
    });

    it('should update description', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.update({ description: 'Updated description' });

      expect(topic.description).toBe('Updated description');
    });

    it('should update masteryLevel (user manual override)', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.update({ masteryLevel: 7 });

      expect(topic.masteryLevel).toBe(7);
    });

    it('should update displayOrder', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      topic.update({ displayOrder: 3 });

      expect(topic.displayOrder).toBe(3);
    });
  });

  // --- fromPersistence ---

  describe('fromPersistence', () => {
    it('should reconstitute a topic with all properties', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-03-01');

      const topic = Topic.fromPersistence({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Graphs',
        description: 'BFS, DFS, Dijkstra',
        masteryLevel: 5,
        systemMasteryLevel: 7.5,
        status: TopicStatus.IN_PROGRESS,
        displayOrder: 2,
        createdAt,
        updatedAt,
      });

      expect(topic.id).toBe('topic-1');
      expect(topic.name).toBe('Graphs');
      expect(topic.masteryLevel).toBe(5);
      expect(topic.systemMasteryLevel).toBe(7.5);
      expect(topic.status.value).toBe('in_progress');
    });
  });

  // --- toJSON ---

  describe('toJSON', () => {
    it('should serialize status as a string, not TopicStatus object', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      const json = topic.toJSON();

      expect(json.status).toBe('not_started');
      expect(typeof json.status).toBe('string');
    });

    it('should include all expected fields', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Binary Search',
        description: 'Efficient search',
      });

      const json = topic.toJSON();

      expect(json).toEqual(
        expect.objectContaining({
          id: 'topic-1',
          subjectId: 'subject-1',
          name: 'Binary Search',
          description: 'Efficient search',
          status: 'not_started',
          masteryLevel: 1,
          systemMasteryLevel: 0,
          displayOrder: 0,
        }),
      );
    });

    it('should produce clean JSON via JSON.stringify (no Value Object wrappers)', () => {
      const topic = Topic.create({
        id: 'topic-1',
        subjectId: 'subject-1',
        name: 'Topic',
      });

      const stringified = JSON.stringify(topic.toJSON());
      const parsed = JSON.parse(stringified);

      expect(parsed.status).toBe('not_started');
      expect(typeof parsed.status).toBe('string');
    });
  });
});
