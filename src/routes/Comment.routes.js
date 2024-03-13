import { Router } from "express";
import {verifyJWT} from "../middlewares/Auth.middleware.js"
import { 
    addComment,
    deleteComment,
    getVideoComments, 
    updateComment,
} from "../controllers/Comment.controller.js";

const router = Router()

router.route("/:videoId").get(verifyJWT,getVideoComments)

router.route("/:videoId").post(verifyJWT,addComment)

router.route("/c/:commentId").patch(verifyJWT,updateComment)

router.route("/c/:commentId").delete(verifyJWT,deleteComment)

export default router