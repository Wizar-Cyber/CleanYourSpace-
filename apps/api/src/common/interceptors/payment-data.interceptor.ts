import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserRole } from '../../modules/users/user.entity';

const PAYMENT_FIELDS = new Set([
  'price',
  'hourlyRateSnapshot',
  'paymentCalculated',
]);

const ADMIN_ROLES = new Set([UserRole.SUPER_ADMIN, UserRole.MANAGER]);

function stripPaymentFields(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(stripPaymentFields);
  }
  if (data && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (PAYMENT_FIELDS.has(key)) {
        continue;
      }
      result[key] = value && typeof value === 'object' ? stripPaymentFields(value) : value;
    }
    return result;
  }
  return data;
}

@Injectable()
export class PaymentDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || ADMIN_ROLES.has(user.role)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((res) => stripPaymentFields(res)),
    );
  }
}
