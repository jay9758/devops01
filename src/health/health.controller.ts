import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthReport, HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 200 when the app and its database are healthy, 503 otherwise.
   * Load balancers and orchestrators (Azure App Service, Kubernetes) use the
   * status code to decide whether to route traffic to this instance.
   */
  @Get()
  async check(): Promise<HealthReport> {
    const report = await this.healthService.check();
    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
