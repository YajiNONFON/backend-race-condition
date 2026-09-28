import { NextFunction, Request, Response } from "express";
import { AppError } from "./errors";

// Central middleware: every module throws an error (AppError or generic)
// and this single place decides the response format.
// This applies the principle from the concepts guide: the HTTP status
// code must reflect who is responsible for the error.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  console.error(err);
  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "An internal error occurred",
  });
}
