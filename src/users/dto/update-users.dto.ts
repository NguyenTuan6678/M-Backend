import { CreateUsersDTO } from './create-users.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUsersDTO extends PartialType(CreateUsersDTO) {}
