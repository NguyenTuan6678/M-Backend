import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';

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
  const res = {
    code: ERROR_RES.SUCCESS.statusCode,
    info: ERROR_INFO.SUCCESS,
    message,
    content: null,
  };
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
