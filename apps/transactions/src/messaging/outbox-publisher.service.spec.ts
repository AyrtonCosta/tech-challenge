import { PrismaService } from '../prisma/prisma.service';
import { KafkaProducerService } from './kafka-producer.service';
import { OutboxPublisherService } from './outbox-publisher.service';

jest.mock('./kafka-producer.service', () => ({
  KafkaProducerService: class KafkaProducerService {},
}));

const MESSAGE = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  topic: 'transaction.created',
  key: '01a06890-f490-751b-ac5a-bd9ea2436780',
  payload: { version: 1 },
};

function buildPublisher(deps: {
  findMany: jest.Mock;
  update: jest.Mock;
  publish: jest.Mock;
}): OutboxPublisherService {
  return new OutboxPublisherService(
    { outboxMessage: { findMany: deps.findMany, update: deps.update } } as unknown as PrismaService,
    { publish: deps.publish } as unknown as KafkaProducerService,
  );
}

describe('OutboxPublisherService', () => {
  it('publica e so entao marca a mensagem como enviada', async () => {
    const findMany = jest.fn().mockResolvedValue([MESSAGE]);
    const update = jest.fn().mockResolvedValue({});
    const publish = jest.fn().mockResolvedValue(undefined);
    const publisher = buildPublisher({ findMany, update, publish });

    await publisher.tick();

    expect(publish).toHaveBeenCalledWith(MESSAGE.topic, MESSAGE.key, MESSAGE.payload);
    expect(update).toHaveBeenCalledWith({
      where: { id: MESSAGE.id },
      data: expect.objectContaining({ published: true }),
    });
    expect(publish.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('nao marca publicado quando o Kafka recusa', async () => {
    const findMany = jest.fn().mockResolvedValue([MESSAGE]);
    const update = jest.fn();
    const publish = jest.fn().mockRejectedValue(new Error('broker down'));
    const publisher = buildPublisher({ findMany, update, publish });

    await publisher.tick();

    expect(update).not.toHaveBeenCalled();
  });
});
