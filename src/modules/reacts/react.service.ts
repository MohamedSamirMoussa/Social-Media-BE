import { Request, Response } from "express";
import {
  PostModel,
  PostRepository,
  ReactModel,
  ReactRepository,
} from "../../DB";
import { Types } from "mongoose";
import { BadRequestError, ConflictError, successHandler } from "../../utils";

class ReactServices {
  private reactModel = new ReactRepository(ReactModel);
  private postModel = new PostRepository(PostModel);
  constructor() {}

  toggleReact = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.user?._id;

    if (!postId || !userId)
      throw new ConflictError("Missing part in this user");
    const post = await this.postModel.findById({
      id: postId as unknown as Types.ObjectId,
    });

    if (!post) throw new BadRequestError("Not found post");

    const isExistReact = await this.reactModel.findOne({
      filter: {
        userId,
        postId,
      },
    });

    let isLiked: boolean = false;

    if (isExistReact) {
      await this.reactModel.deleteOne({
        filter: {
          _id: isExistReact._id,
        },
      });

      isLiked = false;
    } else {
      await this.reactModel.create({
        data: {
          postId: postId as unknown as Types.ObjectId,
          userId,
        },
      });
      isLiked = true;
    }

    const likeCounts = await this.reactModel.countDocuments({
      filter: { postId },
    });

    return successHandler({
      res,
      message: isLiked
        ? "Post liked successfully"
        : "Post un liked successfully",
      data: {
        postId,
        userId,
        likeCounts,
        isLiked,
      },
    });
  };
}

export default new ReactServices();
