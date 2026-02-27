import { GetPlanUseCase } from '../../../src/application/use-cases/plans/get-plan.use-case';
import { StudyPlanNotFoundError, StudyPlan } from '../../../src/domain/study';
import { PlanStatus } from '../../../src/domain/study/value-objects/plan-status.vo';
import { createMockStudyPlanRepository } from '../../helpers/mock-factories';
import type { StudyPlanWithFullDetails } from '../../../src/application/ports/study-plan-repository.port';

describe('GetPlanUseCase', () => {
  const userId = 'user-123';
  const planId = 'plan-456';
  const planRepo = createMockStudyPlanRepository();
  const useCase = new GetPlanUseCase(planRepo);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the plan with full details when found', async () => {
    // Arrange
    const plan = StudyPlan.create({ id: planId, userId, name: 'Algoritmos' });
    const fullDetails: StudyPlanWithFullDetails = {
      plan,
      subjects: [
        {
          id: 'subj-1',
          studyPlanId: planId,
          name: 'Arrays',
          description: null,
          color: '#FF0000',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          topics: [],
        },
      ],
    };
    planRepo.findByIdAndUserId.mockResolvedValue(fullDetails);

    // Act
    const result = await useCase.execute(planId, userId);

    // Assert
    expect(result).toBe(fullDetails);
    expect(result.plan.name).toBe('Algoritmos');
    expect(result.subjects).toHaveLength(1);
  });

  it('should query by planId AND userId for ownership scoping', async () => {
    planRepo.findByIdAndUserId.mockResolvedValue({
      plan: StudyPlan.create({ id: planId, userId, name: 'X' }),
      subjects: [],
    });

    await useCase.execute(planId, userId);

    expect(planRepo.findByIdAndUserId).toHaveBeenCalledWith(planId, userId);
  });

  it('should throw StudyPlanNotFoundError when plan does not exist', async () => {
    planRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent', userId)).rejects.toThrow(
      StudyPlanNotFoundError,
    );
  });

  it('should throw StudyPlanNotFoundError when plan belongs to another user', async () => {
    // The repository returns null because userId doesn't match
    planRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(useCase.execute(planId, 'other-user')).rejects.toThrow(
      StudyPlanNotFoundError,
    );
  });
});
