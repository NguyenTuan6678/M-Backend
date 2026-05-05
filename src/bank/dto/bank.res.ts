import { MessageResponse } from '@app-types/message.res';
import { Bank } from '@schemas/bank.schema';

export class BankResponseDto extends MessageResponse {
  content: Bank;
}
