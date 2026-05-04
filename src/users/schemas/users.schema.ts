import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { createUserMethods } from '@hooks/users.hook';
import { createUserPreSaveHooks } from '@middleware/users.middleware';
import { Role } from '@utils/role.enum';

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

export type UserDocument = HydratedDocument<User> & IUserMethods;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, trim: true, type: String })
  username: string;
  @Prop({ required: true, type: String })
  password: string;
  @Prop({ default: true, type: Boolean })
  isActive: boolean;
  @Prop({ type: String, enum: Role, required: true })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 });
UserSchema.index({ createdAt: -1 });

createUserPreSaveHooks(UserSchema);

createUserMethods(UserSchema);
