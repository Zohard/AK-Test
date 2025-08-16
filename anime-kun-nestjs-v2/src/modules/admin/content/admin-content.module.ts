import { Module } from '@nestjs/common';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';
import { PrismaService } from '../../../shared/services/prisma.service';

@Module({
  controllers: [AdminContentController],
  providers: [AdminContentService, PrismaService],
  exports: [AdminContentService]
})
export class AdminContentModule {}