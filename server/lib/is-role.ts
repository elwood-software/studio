import type { HandlerContext, Next } from "../types.ts";
import { UnauthorizedError } from "./errors.ts";
import { Role, Roles } from "../constants.ts";

export function isRole(role: Role | Role[]) {
  return async (c: HandlerContext, next: Next) => {
    const role_ = Array.isArray(role) ? role : [role];
    const userRole = c.get("jwtPayload")?.role;

    if (!role_.includes(userRole)) {
      throw new UnauthorizedError(`Invalid authentication role "${userRole}"`);
    }

    await next();
  };
}

export function isAuthenticated() {
  return isRole(["service_role", "authenticated"]);
}
