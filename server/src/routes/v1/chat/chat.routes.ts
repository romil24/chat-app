import { Router } from "express";
import {
  addNewParticipantInGroupChat,
  createAGroupChat,
  createOrGetAOneOnOneChat,
  deleteGroupChat,
  deleteOneOnOneChat,
  getAllChats,
  getGroupChatDetails,
  leaveGroupChat,
  removeParticipantFromGroupChat,
  renameGroupChat,
  searchAvailableUsers,
} from "../../../controller/chat-app/chat.controllers";
import { verifyJWT } from "../../../middlewares/auth.middlewares";
import {
  createAGroupChatValidator,
  updateGroupChatNameValidator,
} from "../../../validators/chat-app/chat.validators";
import { mongoIdPathVariableValidator } from "../../../validators/common/mongodb.validators";
import { validate } from "../../../validators/validate";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllChats);

router.route("/users").get(searchAvailableUsers);

router
  .route("/c/:receiverId")
  .post(
    mongoIdPathVariableValidator("receiverId"),
    validate,
    createOrGetAOneOnOneChat
  );

router
  .route("/group")
  .post(createAGroupChatValidator(), validate, createAGroupChat);

router
  .route("/group/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getGroupChatDetails)
  .patch(
    mongoIdPathVariableValidator("chatId"),
    updateGroupChatNameValidator(),
    validate,
    renameGroupChat
  )
  .delete(mongoIdPathVariableValidator("chatId"), validate, deleteGroupChat);

router
  .route("/group/:chatId/:participantId")
  .post(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("participantId"),
    validate,
    addNewParticipantInGroupChat
  )
  .delete(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("participantId"),
    validate,
    removeParticipantFromGroupChat
  );

router
  .route("/leave/group/:chatId")
  .delete(mongoIdPathVariableValidator("chatId"), validate, leaveGroupChat);

router
  .route("/remove/:chatId")
  .delete(mongoIdPathVariableValidator("chatId"), validate, deleteOneOnOneChat);

export default router;
