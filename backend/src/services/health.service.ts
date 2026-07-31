export class HealthService {
  public getHealthStatus(): { status: string } {
    return { status: 'ok' };
  }
}

export const healthService = new HealthService();
