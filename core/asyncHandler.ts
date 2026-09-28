import { NextFunction, Request, Response } from "express";

// Avoids repeating try/catch in every controller.
// Any async error is automatically forwarded to the central error handler.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
