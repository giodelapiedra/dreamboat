import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

interface ValidationResult {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

export function validate(schema: ZodType<ValidationResult>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (result.body) {
      req.body = result.body;
    }

    if (result.params) {
      req.params = result.params as Request["params"];
    }

    if (result.query) {
      Object.defineProperty(req, "query", {
        value: result.query as Request["query"],
        configurable: true,
      });
    }

    next();
  };
}
