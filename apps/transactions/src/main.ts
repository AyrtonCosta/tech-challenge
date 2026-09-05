import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const webOrigin = app.get(ConfigService).get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
  app.enableCors({ origin: webOrigin });

  const port = app.get(ConfigService).get<number>('TRANSACTIONS_PORT') ?? 3001;
  await app.listen(port);
}

void bootstrap();
