import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { KafkaProducerService } from './kafka-producer.service';

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 1000;

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer: NodeJS.Timeout | undefined;
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async tick(): Promise<void> {
    if (this.ticking) {
      return;
    }

    this.ticking = true;

    try {
      const pending = await this.prisma.outboxMessage.findMany({
        where: { published: false },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      for (const message of pending) {
        try {
          await this.kafka.publish(message.topic, message.key, message.payload);
          await this.prisma.outboxMessage.update({
            where: { id: message.id },
            data: { published: true, publishedAt: new Date() },
          });
        } catch (error) {
          this.logger.error(
            `Falha ao publicar outbox ${message.id} no topico ${message.topic}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    } finally {
      this.ticking = false;
    }
  }
}
