/**
 * Domain errors. Services throw these; only the error handler knows how to turn
 * them into HTTP responses, which is what keeps services free of `res`.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Malformed input: failed validation, or a value that cannot refer to anything. */
export class BadRequest extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class NotFound extends AppError {
  constructor(message: string, details?: unknown) {
    super(404, 'NOT_FOUND', message, details);
  }
}

/**
 * The request was well-formed but the resource is in the wrong state for it —
 * an illegal booking transition, or resting a mechanic who is mid-job.
 */
export class Conflict extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

/** Syntactically valid, but it breaks a business rule. */
export class UnprocessableEntity extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}
