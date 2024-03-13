import { 
    createTweet, 
    deleteTweet, 
    getUserTweets, 
    updateTweet 
} from "../controllers/Tweet.controller.js";
import {Router} from "express";
import verifyJWT from "../middlewares/Auth.middleware.js"

const router = Router();

router.route("/").post(verifyJWT,createTweet)

router.route("/user/:userId").get(verifyJWT,getUserTweets)

router.route("/:tweetId").patch(verifyJWT,updateTweet)

router.route("/:tweetId").delete(verifyJWT,deleteTweet)

export default router