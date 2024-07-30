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
