import z from "zod";
import { RoleEnum, StatusEnum } from "../utils";

export const generalFields = {
  firstName: z.string({ error: "First name is required" }),
  lastName: z.string({ error: "Last name is required" }),
  password: z
    .string({ error: "Password is required" })
    .regex(
      /^[aA-Zz](?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/,
      "Password must start with an uppercase letter and contain letters, numbers, and special characters",
    ),
  confirmPassword: z.string({ error: "Confirm password is required" }),
  email: z.email({ error: "email is required" }),
  role: z
    .enum(Object.values(RoleEnum), {
      error: "Role is required",
    })
    .optional(),
  otp: z.string().regex(/^\d{6}$/, { message: "OTP must be 6 digits" }),
  token: z.string({ error: "Token is required" }),
  status: z.enum(Object.values(StatusEnum), {
    error: "Status isn't valid",
  }),
};
