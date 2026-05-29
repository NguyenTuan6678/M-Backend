import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { RolesGuard } from '@users/guards/roles.guard';
import { Roles } from '@common/decorators/role.decorator';
import { Role } from '@utils/role.enum';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditLogController {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  @Get()
  async findAll(
    @Query('resource') resource?: string,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: Record<string, any> = {};

    if (resource) filter.resource = resource;
    if (resourceId) filter.resourceId = resourceId;
    if (action) filter.action = action;

    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit || 50))
      .exec();

    return {
      code: 200,
      info: 'SUCCESS',
      message: 'Audit logs fetched successfully',
      content: logs,
    };
  }
}
