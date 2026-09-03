import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('ANTI_FRAUD_PORT') ?? 3002;
  await app.listen(port);
}

void bootstrap();
