import { MessageResponse } from '@app-types/message.res';
import { User } from '@users/schemas/users.schema';
import { Exclude, Expose, Transform } from 'class-transformer';

export class UsersResponseDTO extends MessageResponse {
  content?: User;
  // @Expose()
  // @Transform(({ obj }) => obj._id?.toString())
  // _id: string;
  // @Expose()
  // username: string;
  // @Exclude()
  // password: string;
  // @Expose()
  // role: string;
  // @Expose()
  // createdAt: Date;
  // @Expose()
  // updatedAt: Date;
}
