import { CreateUsersDTO } from '@users/dto/create-users.req';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUsersDTO extends PartialType(CreateUsersDTO) {}
