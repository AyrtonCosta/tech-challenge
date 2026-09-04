import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { KafkaProducerService } from './kafka-producer.service';
import { OutboxPublisherService } from './outbox-publisher.service';
import { StatusUpdatedConsumer } from './status-updated.consumer';

@Module({
  imports: [PrismaModule, TransactionsModule],
  providers: [KafkaProducerService, OutboxPublisherService, StatusUpdatedConsumer],
})
export class MessagingModule {}
