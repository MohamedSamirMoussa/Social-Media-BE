import { Router } from "express";
import { authentication } from "../../middlewares";
import chatBotServices from "./bots.service";

export const router = Router();

router.post("/:conversationId", authentication(), chatBotServices.sendMessage);
router.post("/", authentication(), chatBotServices.createConversation);
