export class UnauthorizedError extends Error {
  status = 403;
  name = "unauthorized";
}

export class SubscriptionNotAvailable extends Error {
  status = 400;
  name = "subscription_not_available";

  constructor(message: string, public code = -1) {
    super(message);
  }
}

export function createQueryNotFoundError(message: string): new () => Error {
  return class QueryNotFoundError extends Error {
    status = 404;
    name = "query_not_found";

    constructor() {
      super(message);
    }
  };
}
