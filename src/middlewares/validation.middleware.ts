import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { BadRequestError } from "../utils";

export type KeyRequestType = keyof Request;
export type SchemaType = Partial<Record<KeyRequestType, ZodType>>;

// export const validation = (schema: SchemaType) => {
//     return (req: Request, res: Response, next: NextFunction) => {

//         const errors: Record<string, string> = {}

//         for (const key of Object.keys(schema) as KeyRequestType[]) {
//             const currentSchema = schema[key]
//             if (!currentSchema) continue;

//             const result = currentSchema.safeParse(req[key])
//             if (!result.success)
//                 for (let issue of result.error.issues) {
//                     const path = issue.path.join(".")
//                     if (!errors[path])
//                         errors[path] = issue.message;
//                 };
//         }

//         next()
//     }
// }

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const key of Object.keys(schema) as KeyRequestType[]) {
      const currentSchema = schema[key];

      if (!currentSchema) continue;

      const result = currentSchema.safeParse(req[key]);

      if (!result.success) {
        const issue = result.error.issues[0];

        throw new BadRequestError(issue?.message ?? "Validation failed");
      }
    }

    next();
  };
};
