// Shared business errors, used by every module.
// Each error carries its own HTTP status code, so the central
// error handler never has to guess what to return.

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super("Insufficient balance to complete this withdrawal", 409, "INSUFFICIENT_FUNDS");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}
