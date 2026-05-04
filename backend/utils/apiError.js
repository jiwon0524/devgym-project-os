export class ApiError extends Error {
  constructor(message, { statusCode = 400, code = "BAD_REQUEST" } = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
