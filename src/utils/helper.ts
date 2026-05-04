import { MessageResponse } from '@app-types/message.res';

/**
 * @param content
 * @param metadata
 * @returns
 */

export function responseHelper<T extends null>(
  content: T,
  code?: number,
  info?: string,
  message?: string,
): MessageResponse {
  const res = { code: 200, info: 'Success', message, content: null };
  res.content = content;
  if (code) {
    res.code = code;
  }
  if (info) {
    res.info = info;
  }

  if (message) {
    res.message = message;
  }
  return res;
}
