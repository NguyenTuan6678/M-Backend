import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AuditAction } from './audit-action.enum';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  timestamps: true,
  collection: 'audit_logs',
})
export class AuditLog {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  actorId?: Types.ObjectId | null;

  @Prop({ type: String, default: '' })
  actorUsername?: string;

  @Prop({ type: String, default: '' })
  actorRole?: string;

  @Prop({ type: String, enum: AuditAction, required: true })
  action: AuditAction;

  @Prop({ type: String, required: true })
  resource: string;

  @Prop({ type: String, required: false, default: '' })
  resourceId?: string;

  @Prop({ type: Object, default: null })
  before?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  after?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, any> | null;

  @Prop({ type: String, default: '' })
  ip?: string;

  @Prop({ type: String, default: '' })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
