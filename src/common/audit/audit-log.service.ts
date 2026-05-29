import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AuditAction } from './audit-action.enum';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

export type AuditActor = {
  id?: string;
  username?: string;
  role?: string;
};

export type CreateAuditLogParams = {
  actor?: AuditActor | null;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      const sanitizedParams = {
        ...params,
        before: this.sanitize(params.before),
        after: this.sanitize(params.after),
        metadata: this.sanitize(params.metadata),
      };

      await Promise.allSettled([
        this.writeToDatabase(sanitizedParams),
        this.writeToFile(sanitizedParams),
      ]);
    } catch (error: any) {
      /**
       * Audit log không nên làm fail nghiệp vụ chính.
       */
      this.logger.error(`Create audit log failed: ${error.message}`);
    }
  }

  private async writeToDatabase(params: CreateAuditLogParams): Promise<void> {
    const actorId =
      params.actor?.id && Types.ObjectId.isValid(params.actor.id)
        ? new Types.ObjectId(params.actor.id)
        : null;

    await this.auditLogModel.create({
      actorId,
      actorUsername: params.actor?.username || '',
      actorRole: params.actor?.role || '',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || '',
      before: params.before ?? null,
      after: params.after ?? null,
      metadata: params.metadata ?? null,
      ip: params.ip || '',
      userAgent: params.userAgent || '',
    });
  }

  private async writeToFile(params: CreateAuditLogParams): Promise<void> {
    const auditFileEnabled = process.env.AUDIT_LOG_FILE_ENABLED !== 'false';

    if (!auditFileEnabled) return;

    const logDir =
      process.env.AUDIT_LOG_FILE_DIR ||
      path.join(process.cwd(), 'logs', 'audit');

    await fs.mkdir(logDir, { recursive: true });

    const date = new Date().toISOString().slice(0, 10);
    const filePath = path.join(logDir, `audit-${date}.log`);

    const logLine = {
      time: new Date().toISOString(),
      actorId: params.actor?.id || null,
      actorUsername: params.actor?.username || '',
      actorRole: params.actor?.role || '',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || '',
      before: params.before ?? null,
      after: params.after ?? null,
      metadata: params.metadata ?? null,
      ip: params.ip || '',
      userAgent: params.userAgent || '',
    };

    await fs.appendFile(filePath, `${JSON.stringify(logLine)}\n`, 'utf8');
  }

  private sanitize(value: any) {
    if (!value) return value;

    const cloned = JSON.parse(JSON.stringify(value));

    this.removeSensitiveFields(cloned);

    return cloned;
  }

  private removeSensitiveFields(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    const sensitiveKeys = [
      'password',
      'oldPassword',
      'newPassword',
      'accessToken',
      'refreshToken',
      'reToken',
      'token',
      'authorization',
    ];

    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.includes(key)) {
        obj[key] = '[REDACTED]';
        continue;
      }

      if (typeof obj[key] === 'object') {
        this.removeSensitiveFields(obj[key]);
      }
    }
  }
}
