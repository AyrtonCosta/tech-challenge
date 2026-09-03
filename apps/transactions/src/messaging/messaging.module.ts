import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { KafkaProducerService } from './kafka-producer.service';
import { OutboxPublisherService } from './outbox-publisher.service';

@Module({
  imports: [PrismaModule],
  providers: [KafkaProducerService, OutboxPublisherService],
})
export class MessagingModule {}
