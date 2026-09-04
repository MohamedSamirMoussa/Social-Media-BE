import mongoose from "mongoose";
import { NotFoundError } from "../../utils";

export const DBconnection = async () => {
  try {
    if (!process.env.DB_URL) throw new NotFoundError("Data base not found");

    await mongoose.connect(process.env.DB_URL as string, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("====================================");
    console.log("Data base connected successfully");
    console.log("====================================");
  } catch (error) {
    throw new Error("Data base connection failed", { cause: error });
  }
};
