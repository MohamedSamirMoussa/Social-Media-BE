import z from "zod";
import { generalFields } from "../../middlewares";

export const listRequests = {
  query: z.strictObject({
    status:generalFields.status
  }),
};
