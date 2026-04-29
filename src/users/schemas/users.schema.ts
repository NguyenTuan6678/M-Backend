import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { createUserMethods } from 'hooks/users.hook';
import { createUserPreSaveHooks } from 'middleware/users.middleware';

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
  @Prop({ required: true, trim: true })
  username: string;
  @Prop({ required: true })
  password: string;
  @Prop({ default: true })
  isActive: boolean;
  @Prop({ default: Date.now })
  createdAt: Date;
  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 });
UserSchema.index({ createdAt: -1 });

createUserPreSaveHooks(UserSchema);

createUserMethods(UserSchema);
