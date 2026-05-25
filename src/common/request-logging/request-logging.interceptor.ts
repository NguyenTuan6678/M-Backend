import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const method = request.method;
    const url = request.originalUrl || request.url;
    const ip =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress;

    const userId = request.user?.id || request.user?._id || 'anonymous';

    const start = Date.now();

    if (url.startsWith('/health')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const durationMs = Date.now() - start;

        this.logger.log(
          `[REQUEST] ${method} ${url} ${statusCode} ${durationMs}ms user=${userId} ip=${ip}`,
        );
      }),

      catchError((error) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = error?.status || response?.statusCode || 500;
        const durationMs = Date.now() - start;

        this.logger.error(
          `[REQUEST_ERROR] ${method} ${url} ${statusCode} ${durationMs}ms user=${userId} ip=${ip} message=${error.message}`,
          error.stack,
        );

        return throwError(() => error);
      }),
    );
  }
}
