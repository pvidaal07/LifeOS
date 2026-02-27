import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user from the request.
 *
 * Usage:
 *   @CurrentUser() user          - returns full user object { sub, email, name }
 *   @CurrentUser('sub') userId   - returns only the 'sub' field (user id)
 *   @CurrentUser('email') email  - returns only the email
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
