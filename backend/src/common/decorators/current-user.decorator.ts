import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el usuario autenticado actual.
 *
 * Uso:
 *   @CurrentUser() user          → devuelve el objeto user completo
 *   @CurrentUser('sub') userId   → devuelve solo el campo 'sub' (id)
 *   @CurrentUser('email') email  → devuelve solo el email
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
