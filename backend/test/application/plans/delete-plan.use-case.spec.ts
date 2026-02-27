import { DeletePlanUseCase } from '../../../src/application/use-cases/plans/delete-plan.use-case';
import { StudyPlan, StudyPlanNotFoundError } from '../../../src/domain/study';
import { createMockStudyPlanRepository } from '../../helpers/mock-factories';

describe('DeletePlanUseCase', () => {
  const userId = 'user-123';
  const planId = 'plan-456';
  const planRepo = createMockStudyPlanRepository();
  const useCase = new DeletePlanUseCase(planRepo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete the plan and return the deleted entity', async () => {
    // Arrange
    const plan = StudyPlan.create({ id: planId, userId, name: 'Algoritmos' });
    const fullDetails = { plan, subjects: [] };
    planRepo.findByIdAndUserId.mockResolvedValue(fullDetails);
    planRepo.delete.mockResolvedValue(plan);

    // Act
    const result = await useCase.execute(planId, userId);

    // Assert
    expect(result).toBe(plan);
    expect(planRepo.delete).toHaveBeenCalledWith(planId, userId);
  });

  it('should verify ownership before deleting', async () => {
    const plan = StudyPlan.create({ id: planId, userId, name: 'Test' });
    planRepo.findByIdAndUserId.mockResolvedValue({ plan, subjects: [] });
    planRepo.delete.mockResolvedValue(plan);

    await useCase.execute(planId, userId);

    // findByIdAndUserId is called first — the ownership check
    expect(planRepo.findByIdAndUserId).toHaveBeenCalledWith(planId, userId);
    // delete is called only after ownership is verified
    expect(planRepo.delete).toHaveBeenCalledAfter(planRepo.findByIdAndUserId);
  });

  it('should throw StudyPlanNotFoundError when plan does not exist', async () => {
    planRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent', userId)).rejects.toThrow(
      StudyPlanNotFoundError,
    );
    expect(planRepo.delete).not.toHaveBeenCalled();
  });

  it('should throw StudyPlanNotFoundError when plan belongs to another user', async () => {
    planRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(useCase.execute(planId, 'other-user')).rejects.toThrow(
      StudyPlanNotFoundError,
    );
    expect(planRepo.delete).not.toHaveBeenCalled();
  });
});
