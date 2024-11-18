import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {getSubscribedChannels, getUserChannelSubscribers, toggleSubscription} from "../controllers/subscription.controller.js"
const router = Router()

router.route("/get-channel-list/:subscriberId").get(verifyJWT,getSubscribedChannels)

router.route("/subscribes/:channelId").get(verifyJWT,toggleSubscription)

router.route("/get-subscriber-list").get(verifyJWT,getUserChannelSubscribers)

export default router