import { BadRequestError } from "../handlingErrors/handlingErrors";
import { cloud } from "./cloudinary.config";


export const uploadFile = async ({
  file,
  path = "general",
}: {
  file: string;
  path: string;
}) => {
  return await cloud().uploader.upload(file, {
    folder: `${process.env.APP_NAME}/user/${path}`,
  });
};

export const uploadFiles = async ({
  files,
  path,
}: {
  files: string[];
  path: string;
}) => {
  let result = [];

  for (const file of files) {
    const { secure_url, public_id } = await uploadFile({ file, path });
    result.push({ secure_url, public_id });
  }

  return result;
};

export const deleteFile = async (publicId: string) => {
  try {
    const result = await cloud().uploader.destroy(publicId);

    return result;
  } catch (error) {
    throw new BadRequestError("Failed to delete this file", error);
  }
};
