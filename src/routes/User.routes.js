import { Router } from "express";
import { 
    registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    getUserChannelDetails,
    getWatchHistory,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage
 } from "../controllers/Users.controllers.js";
import {upload} from "../middlewares/Multer.middleware.js"
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

//now the control will come here and from here the control will go to the {registerUser} here==>../controllers/Users.controllers and execute the code that is written in that file.

//we follow this practice bcz actually when we will go to the user route the url will be like localhost:8000/user/register.

// down here upload.fields is used, why? ==> cuz upload is a middleware so basically it will configure that if the file has been uploaded or not.

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount : 1
        }
]), registerUser)


router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-Password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-user").patch(verifyJWT,updateUserDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelDetails)
router.route("/getWatchHistory").get(verifyJWT, getWatchHistory)

export default router