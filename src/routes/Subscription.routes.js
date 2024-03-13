import { getSubscribedChannels, 
    getUserChannelSubscribers, 
    toggleSubscription
} from "../controllers/Subscription.controller.js"
import {verifyJWT} from "../middlewares/Auth.middleware.js"
import {Router} from "express"

const router = Router()


router.route("/u/:subscriberId").get(verifyJWT,getSubscribedChannels)

router.route("/c/:channelId").post(verifyJWT,toggleSubscription)

router.route("/c/:channelId").get(verifyJWT,getUserChannelSubscribers)

export default router


