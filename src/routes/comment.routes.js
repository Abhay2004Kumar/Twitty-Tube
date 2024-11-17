import { Router } from "express";
import { createComment, deleteComment, getAllCommentVideo, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/add-comment").post(createComment)

router.route("/update-comment/:commentId").post(verifyJWT,updateComment)

router.route("/delete-comment/:commentId").get(verifyJWT,deleteComment)

router.route("/get-all-video-comments/:videoId").get(verifyJWT,getAllCommentVideo)

export default router