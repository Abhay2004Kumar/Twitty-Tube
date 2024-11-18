import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {createTweet, deleteTweet, getUserTweets, updateTweet} from "../controllers/tweet.controller.js"

const router = Router()

router.route("/create-tweet").post(createTweet)

router.route("/update-tweet/:tweetId").post(verifyJWT,updateTweet)

router.route("/delete-tweet/:tweetId").post(verifyJWT,deleteTweet)

router.route("/get-user-tweeits/:tweetId").post(verifyJWT,getUserTweets)

export default router