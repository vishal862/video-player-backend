import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse} from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/Playlist.model.js";
import { User } from "../models/User.model.js";

const createPlaylist = asyncHandler(async (req,res)=>{

    const {name,description} = req.body

    if(!name){
        throw new ApiError(400,"playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner : req.user._id
    })

    const playlistAddedToUser = await User.aggregate([
        {
            $match : {
                _id : req.user._id
            }
        },
        {
            $lookup : {
                from : "playlists",
                localField : "_id",
                foreignField : "owner",
                as : "playlists"
            }
        },
        {
            $addFields : {
                playlists : {
                    $concatArrays: [
                        "$playlists"
                    ]
                }
            }
        },
        {
            $project : {
                fullName:1,
                username:1,
                email:1,
                avatar:1,
                coverImage:1,
                playlists:1
            }
        }
    ])
    
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistAddedToUser,"Playlist created Successfully")
    )
})

const getUserPlaylist = asyncHandler(async (req,res)=>{

    const {userId} = req.params

    if(!userId){
        throw new ApiError(400,"incorrect user id")
    }

    const playlists = await Playlist.find({
        owner : userId
    })

    if(!playlists || playlists.length === 0){
        throw new ApiError(404,"playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlists,"Playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req,res)=>{

    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400,"incorrect playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req,res)=>{

    const {playlistId,videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400,"playlistId or videoId is missing")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    playlist.videos.push(videoId)

    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200,"video Added to playlist")
    )

})

const removeVideosFromPlaylist = asyncHandler(async (req,res)=>{

    const {videoId,playlistId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400,"playlistId or videoId is missing")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    const index = playlist.videos.indexOf(videoId)

    if(index!=-1){
        playlist.videos.splice(index,1)
    }
   
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200,"video is removed from playlist")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {

    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400,"incorrect playlistId")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"playlist removed successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {

    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId){
        throw new ApiError(400,"incorrect playlistId")
    }

    if(!name || !description){
        throw new ApiError(400,"name or description is missing")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : {
                name : name,
                description : description
            }
        },
        {
            new : true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(404,"playlist not found")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylist,"playlist updated successfully")
    )
    
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideosFromPlaylist,
    deletePlaylist,
    updatePlaylist
}