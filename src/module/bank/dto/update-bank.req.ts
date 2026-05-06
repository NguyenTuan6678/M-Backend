import { PartialType } from '@nestjs/mapped-types';
import { CreateBankDto } from './create-bank.req';

export class UpdateBankDto extends PartialType(CreateBankDto) {}
