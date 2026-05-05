import { MessageResponse } from '@app-types/message.res';
import { Agency } from '@schemas/agency.schema';

export class AgentResponseDto extends MessageResponse {
  content: Agency;
}
