import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response<T> {
  status: number;
  message: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: context.switchToHttp().getResponse().statusCode,
        message: this.determineMessage(context),
        data,
      })),
    );
  }

  private determineMessage(context: ExecutionContext): string {
    if (context.switchToHttp().getRequest().method === 'POST') {
      return 'Resource created successfully';
    }

    if (context.switchToHttp().getRequest().method === 'DELETE') {
      return 'Resource deleted successfully';
    }

    return 'Operation successful';
  }
}
