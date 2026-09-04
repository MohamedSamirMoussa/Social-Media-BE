import { JwtPayload } from "jsonwebtoken";
import { HUserDocument } from "../../DB";


declare module "express-serve-static-core" {
  interface Request {
    user?: HUserDocument;
    decode?: JwtPayload;
  }
}
