export const defaultInstanceId = "00000000-0000-0000-0000-000000000000";

export enum Roles {
  Anon = "anon",
  Authenticated = "authenticated",
  ServiceRole = "service_role",
}

export type Role = "anon" | "authenticated" | "service_role";
