import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';

import { CreatedEventConsumer } from './created-event.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '../../..', '.env'),
    }),
  ],
  providers: [CreatedEventConsumer],
})
export class AppModule {}
