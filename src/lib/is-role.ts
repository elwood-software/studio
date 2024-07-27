import type { HandlerContext } from "../types.ts";
import { UnauthorizedError } from "./errors.ts";

export function isRole(role: string | string[]) {
  return async (c: HandlerContext, next: Next) => {
    const role_ = Array.isArray(role) ? role : [role];
    const userRole = c.get("jwtPayload").role;

    if (!role_.includes(userRole)) {
      throw new UnauthorizedError(`Invalid authentication role "${userRole}"`);
    }

    await next();
  };
}
