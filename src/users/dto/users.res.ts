import { Exclude, Expose, Transform } from 'class-transformer';

export class UsersResponseDTO {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString())
  _id: string;

  @Expose()
  username: string;

  @Exclude()
  password: string;

  @Expose()
  role: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
