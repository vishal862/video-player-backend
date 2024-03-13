import {Video} from "../models/Video.model.js"
import {Subscription} from "../models/Subscription.model.js"
import {Like} from "../models/Like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.user._id; // Assuming you have a channelId field in the user document

    if(!channelId){
        throw new ApiError(400,"incorrect channelId")
    }

    const totalVideoViews = await Video.aggregate([
        {
            $match : {
                owner : channelId
            }
        },
        {
            $group : {
                _id : null,
                totalViews : {
                    $sum : "$views"
                }
            }
        }
    ])

    if(!totalVideoViews){
        throw new ApiError(500,"error while fetching views")
    }

    const totalSubscribers = await Subscription.countDocuments({
        channel : channelId
    })

    if(!totalSubscribers){
        throw new ApiError(500,"error while fetching totalSubscribers")
    }

    const totalVideos = await Video.countDocuments({owner : channelId})

    if(!totalVideos){
        throw new ApiError(500,"error while fetching totalVideos")
    }

    const totalLikes = await Like.countDocuments({
        video : {
            $exists : true
        }
    })

    if(!totalLikes){
        throw new ApiError(500,"error while fetching totalLikes")
    }

    const response = {
        totalVideoViews: totalVideoViews.length > 0 ? totalVideoViews[0].totalViews : 0,
        totalSubscribers,
        totalVideos,
        totalLikes
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,"stat fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400,"incorrect channelId")
    }

    const videos = await Video.find({
        owner : channelId
    })

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for the channel.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }