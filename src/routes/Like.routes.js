import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js"
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/Like.controller.js";

const router = Router();

router.route("/toggle/v/:videoId").post(verifyJWT,toggleVideoLike)

router.route("/toggle/c/:commentId").post(verifyJWT,toggleCommentLike)

router.route("/toggle/t/:tweetId").post(verifyJWT,toggleTweetLike)

router.route("/videos").get(verifyJWT,getLikedVideos)

export default router