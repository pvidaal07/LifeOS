import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private reconnectInFlight: Promise<void> | null = null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create a pg.Pool with resilient connection settings
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });

    const adapter = new PrismaPg(pool, {
      onPoolError: (err) => {
        Logger.error(`PG pool error: ${err.message}`, err.stack, 'PrismaService');
      },
    });

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Disconnected from database');
  }

  isConnectionClosedError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === 'P1017';
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
      return (error as { code?: unknown }).code === 'P1017';
    }

    return false;
  }

  reconnect(): Promise<void> {
    if (this.reconnectInFlight) {
      return this.reconnectInFlight;
    }

    this.reconnectInFlight = (async () => {
      this.logger.warn('Prisma connection closed (P1017). Reconnecting...');

      try {
        await this.$disconnect();
      } catch (disconnectError) {
        const message =
          disconnectError instanceof Error
            ? disconnectError.message
            : 'Unknown disconnect error';
        this.logger.warn(`Prisma disconnect during reconnect failed: ${message}`);
      }

      await this.$connect();
      this.logger.log('Prisma reconnected successfully');
    })().finally(() => {
      this.reconnectInFlight = null;
    });

    return this.reconnectInFlight;
  }

  async runWithReconnect<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.isConnectionClosedError(error)) {
        throw error;
      }

      await this.reconnect();
      return operation();
    }
  }
}
