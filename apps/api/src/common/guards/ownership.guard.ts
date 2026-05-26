import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const OWNERSHIP_KEY = 'ownership';
export const Ownership = (paramName: string) => Reflector.createDecorator<string>()(paramName);

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const ownershipParam = this.reflector.get<string>(OWNERSHIP_KEY, context.getHandler());

    if (!ownershipParam) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === 'super_admin' || user?.role === 'manager') {
      return true;
    }

    const paramValue = request.params[ownershipParam];

    if (paramValue !== user?.id) {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }
}
