import type { Request, Response } from "express";
import { Error as MongooseError, Types, isValidObjectId } from "mongoose";

import {
  AIroleEnum,
  BadRequestError,
  createChatBot,
  Messages,
  successHandler,
} from "../../utils";

import { BotModel, BotRepository } from "../../DB";

class ChatBots {
  private readonly botRepository = new BotRepository(BotModel);

  /**
   * POST /chat/conversations
   */
  createConversation = async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new BadRequestError("Please sign in");
    }

    const conversation = await this.botRepository.create({
      data: {
        userId,
        messages: [],
      },
    });

    if (!conversation)
      throw new BadRequestError(
        "Something went wrong on create conversation with ai",
      );

    return successHandler({
      res,
      data: {
        conversationId: (
          conversation._id as unknown as Types.ObjectId
        ).toString(),
        messages: conversation.messages || [],
      },
    });
  };

  /**
   * POST /chat/conversations/:conversationId/messages
   */
  sendMessage = async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { conversationId } = req.params;
    const { message } = req.body ?? {};

    if (!userId) {
      throw new BadRequestError("Please sign in");
    }

    if (!isValidObjectId(conversationId)) {
      throw new BadRequestError("Invalid conversation id");
    }

    if (typeof message !== "string" || !message.trim()) {
      throw new BadRequestError("Message must be a non-empty string");
    }

    const text = message.trim();

    if (text.length > 4000) {
      throw new BadRequestError("Message must not exceed 4000 characters");
    }

    const conversation = await this.botRepository.findOne({
      filter: {
        _id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        errMessage: "Conversation doesn't exist",
      });
    }

    if (conversation.messages.length >= 100) {
      throw new BadRequestError("Please start a new conversation");
    }

    const history = conversation.messages
      .slice(-10)
      .map(({ role, content }) => ({
        role,
        content,
      }));

    let historyCharacters = history.reduce(
      (total, currentMessage) => total + currentMessage.content.length,
      0,
    );

    while (history.length > 0 && historyCharacters + text.length > 12000) {
      const removedMessage = history.shift();

      if (removedMessage) {
        historyCharacters -= removedMessage.content.length;
      }
    }

    history.push({
      role: AIroleEnum.user,
      content: text,
    });

    const reply = await createChatBot(history);

    conversation.messages.push(
      {
        role: AIroleEnum.user,
        content: text,
      },
      {
        role: AIroleEnum.assistant,
        content: reply,
      },
    );

    try {
      await conversation.save();
    } catch (error) {
      if (error instanceof MongooseError.VersionError) {
        return res.status(409).json({
          errMessage:
            "Conversation was updated. Please send your message again.",
        });
      }

      throw error;
    }

    return successHandler({
      res,
      data: {
        conversationId: conversation._id.toString(),
        reply,
      },
    });
  };
}

export default new ChatBots();
