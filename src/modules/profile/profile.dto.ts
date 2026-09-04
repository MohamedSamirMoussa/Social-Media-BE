import z from "zod";
import * as validators from './profile.validation'
export type StatusType = z.infer<typeof validators.listRequests.query>