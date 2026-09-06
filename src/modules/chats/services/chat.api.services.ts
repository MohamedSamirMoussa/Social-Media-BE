import { Response } from "express";
import { Request } from "express";
import {
  BadRequestError,
  NotAuthorizedError,
  successHandler,
  uploadFiles,
} from "../../../utils";
import { UploadAttachmentsType } from "./chat.dto";

class ChatApiServices {
  constructor() { }

  uploadAttachments = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new NotAuthorizedError("Please login first");
    }

    const files = (req.files as UploadAttachmentsType) ?? [];

    if (!files.length) {
      throw new BadRequestError("No attachments provided");
    }

    const filePaths = files.map((file) => file.path);

    const attachments = await uploadFiles({
      files: filePaths,
      path: `chat/${req.user._id}`,
    });
    return successHandler({
      res,
      status: 201,

      message: "Attachments uploaded successfully",

      data: {
        attachments,
      },
    });
  };
}

export default new ChatApiServices();
