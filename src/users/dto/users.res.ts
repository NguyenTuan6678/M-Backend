import { Exclude } from 'class-transformer';
export class UsersResponseDTO {
  _id: string;
  username: string;
  @Exclude()
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
