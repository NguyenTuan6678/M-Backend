import { PartialType } from '@nestjs/swagger';
import { CreateAgencyDto } from './create-agency.req';

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {}
