import multer from "multer";
import { StorageEnum } from "../types/common.types";
import os from "node:os";
import { Request } from "express";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "../handlingErrors/handlingErrors";
import path from "node:path";

const allowedMimeTypes = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export const cloudFileUpload = ({
  storageApproach = StorageEnum.memory,
}: {
  storageApproach?: StorageEnum;
}): multer.Multer => {
  const storage =
    storageApproach === StorageEnum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: os.tmpdir(),
          filename: function (req: Request, file: Express.Multer.File, cb) {
            cb(null, `${uuid()}_${file.originalname}`);
          },
        });

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.includes(extension)) {
      return cb(
        new BadRequestError(
          "Only JPEG, PNG, WEBP and GIF images are allowed",
        ) as any,
        false,
      );
    }

    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
};
