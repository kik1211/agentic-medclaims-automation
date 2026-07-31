import { QUEUE_NAMES, QueueName, JobPayloadMap } from './job.types.js';
import { logger } from '../utils/logger.js';

export interface EnqueuedJobInfo {
  jobId: string;
  queueName: QueueName;
  enqueuedAt: string;
}

export class QueueService {
  private readonly memoryQueues = new Map<QueueName, Array<{ jobId: string; payload: unknown }>>();

  constructor() {
    Object.values(QUEUE_NAMES).forEach((name) => {
      this.memoryQueues.set(name, []);
    });
  }

  public async addJob<K extends QueueName>(queueName: K, data: JobPayloadMap[K]): Promise<EnqueuedJobInfo> {
    const timestamp = new Date().toISOString();
    const jobId = `job_${queueName.split('-')[0]}_${Date.now().toString(36)}`;

    const queue = this.memoryQueues.get(queueName);
    if (queue) {
      queue.push({ jobId, payload: data });
    }

    logger.info(`QueueService [${queueName}]: Added job ${jobId} (Payload: ${JSON.stringify(data)})`);

    return {
      jobId,
      queueName,
      enqueuedAt: timestamp,
    };
  }

  public getQueueMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.memoryQueues.forEach((jobs, queueName) => {
      metrics[queueName] = jobs.length;
    });
    return metrics;
  }
}

export const queueService = new QueueService();
