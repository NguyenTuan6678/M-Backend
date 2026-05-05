import { PartialType } from '@nestjs/swagger';
import { CreateAgencyDto } from '@agency/dto/create-agency.req';

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {}
