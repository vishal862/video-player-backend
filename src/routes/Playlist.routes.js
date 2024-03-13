import { Router } from "express";
import verifyJWT from "../middlewares/Auth.middleware.js";
import { 
    addVideoToPlaylist, 
    createPlaylist, 
    deletePlaylist, 
    getPlaylistById, 
    getUserPlaylist, 
    removeVideosFromPlaylist, 
    updatePlaylist 
} from "../controllers/Playlist.controller.js";

const router = Router()

router.route("/").post(verifyJWT,createPlaylist)

router.route("/:playlistId").get(verifyJWT,getPlaylistById)
router.route("/:playlistId").patch(verifyJWT,updatePlaylist)
router.route("/:playlistId").delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideosFromPlaylist)

router.route("/user/:userId").get(getUserPlaylist)

export default router
