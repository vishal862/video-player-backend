import { Router } from "express";
import verifyJWT from "../middlewares/Auth.middleware.js";
import { upload } from "../middlewares/Multer.middleware.js";

import { 
    deleteVideo,
    getAllVideos, 
    getVideoById, 
    publishAVideo, 
    togglePublishStatus, 
    updateVideoDetails, 
    viewVideo,
    watchTheVideo,
} from "../controllers/Videos.controller.js";


const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllVideos)

router.route("/publish").post(
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1
        },
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]),publishAVideo)

router.route("/:videoId")
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.single("thumbnail"), updateVideoDetails)
.post(viewVideo)

router.route("/:videoId/watch").post(watchTheVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router

