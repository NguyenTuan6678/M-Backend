import { PartialType } from '@nestjs/mapped-types';
import { CreateBankDto } from '@bank/dto/create-bank.req';

export class UpdateBankDto extends PartialType(CreateBankDto) {}
