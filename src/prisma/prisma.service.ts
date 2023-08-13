import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  //   async enableShutdownHooks(app: INestApplication) {
  //     this.$on('beforeExit', async (eventName:any) => {
  //       await app.close();
  //     });
  //   }
}
