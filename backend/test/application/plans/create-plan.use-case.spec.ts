import { CreatePlanUseCase } from '../../../src/application/use-cases/plans/create-plan.use-case';
import { StudyPlan } from '../../../src/domain/study';
import { createMockStudyPlanRepository } from '../../helpers/mock-factories';

describe('CreatePlanUseCase', () => {
  const userId = 'user-123';
  const planRepo = createMockStudyPlanRepository();
  const useCase = new CreatePlanUseCase(planRepo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a study plan with the given name and description', async () => {
    // Arrange
    const input = { name: 'Algoritmos', description: 'Plan de algoritmos' };
    planRepo.save.mockImplementation(async (plan: StudyPlan) => plan);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result).toBeInstanceOf(StudyPlan);
    expect(result.name).toBe('Algoritmos');
    expect(result.description).toBe('Plan de algoritmos');
    expect(result.userId).toBe(userId);
    expect(result.status.value).toBe('active');
  });

  it('should create a plan with null description when omitted', async () => {
    const input = { name: 'Matemáticas' };
    planRepo.save.mockImplementation(async (plan: StudyPlan) => plan);

    const result = await useCase.execute(userId, input);

    expect(result.description).toBeNull();
  });

  it('should call repository.save with the created plan', async () => {
    const input = { name: 'Física', description: null };
    planRepo.save.mockImplementation(async (plan: StudyPlan) => plan);

    await useCase.execute(userId, input);

    expect(planRepo.save).toHaveBeenCalledTimes(1);
    const savedPlan = planRepo.save.mock.calls[0][0] as StudyPlan;
    expect(savedPlan.name).toBe('Física');
    expect(savedPlan.userId).toBe(userId);
  });

  it('should generate a unique id for the plan', async () => {
    const input = { name: 'Plan A' };
    planRepo.save.mockImplementation(async (plan: StudyPlan) => plan);

    const result = await useCase.execute(userId, input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('should return the result from repository.save', async () => {
    const input = { name: 'Plan B' };
    const persistedPlan = StudyPlan.create({
      id: 'persisted-id',
      userId,
      name: 'Plan B',
    });
    planRepo.save.mockResolvedValue(persistedPlan);

    const result = await useCase.execute(userId, input);

    expect(result).toBe(persistedPlan);
  });
});
