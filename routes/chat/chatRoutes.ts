import { Router } from "express";

import updateChat from "../../controllers/chat/update-chat";
import getChats from "../../controllers/chat/get-chats";
import getChatMessages from "../../controllers/chat/get-chat-messages";
import createChat from "../../controllers/chat/create-chat";
import createSupportChat from "../../controllers/chat/create-support-chat";
import markSupportComplete from "../../controllers/chat/mark-support-complete";

const router = Router();

router.get("/get-chat-messages", getChatMessages);
router.get("/get-chats", getChats);

router.post("/mark-chat-complete", markSupportComplete);
router.post("/create-chat", createChat);
router.post("/create-support-chat", createSupportChat);
router.post("/update-chat", updateChat);

export default router;