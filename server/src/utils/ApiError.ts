class ApiError extends Error {
  statusCode: number;
  message: string;
  errors: never[];
  stack?: string;
  data: null;
  success: boolean;

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: never[] = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
