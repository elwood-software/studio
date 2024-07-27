export class UnauthorizedError extends Error {
  status = 403;
  name = "unauthorized";
}
