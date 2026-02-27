import { DashboardRepositoryPort, DashboardData } from '../../ports/dashboard-repository.port';

export class GetDashboardUseCase {
  constructor(private readonly dashboardRepo: DashboardRepositoryPort) {}

  async execute(userId: string): Promise<DashboardData> {
    return this.dashboardRepo.getDashboardData(userId);
  }
}
