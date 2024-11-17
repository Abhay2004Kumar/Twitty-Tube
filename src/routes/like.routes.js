import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

import {getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike} from "../controllers/like.controller.js"


const router = Router()

router.route("/toggle-video-like/:videoId").get(verifyJWT,toggleVideoLike)

router.route("/toggle-comment-like/:commentId").get(verifyJWT,toggleCommentLike)

router.route("/toggle-comment-like/:commentId").get(verifyJWT,toggleTweetLike)

router.route("/toggle-liked-video").get(verifyJWT,getLikedVideos)

router.route("/toggle-liked-comment").get(verifyJWT,getLikedCo)

router.route("/toggle-liked-tweet").get(verifyJWT,getLikedTweets)

export default router