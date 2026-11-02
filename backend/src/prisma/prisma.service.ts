import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const url = process.env.DATABASE_URL;
    if (process.env.NODE_ENV === 'test') {
      const isTestDb = url && url.toLowerCase().includes('_test');
      if (!isTestDb) {
        throw new Error(
          `[CRITICAL DB SAFETY] PrismaService detected NODE_ENV=test but DATABASE_URL="${url}" ` +
            `is not a test database! Must end with "_test". Aborting to prevent data corruption.`,
        );
      }
    }
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
  }
}
