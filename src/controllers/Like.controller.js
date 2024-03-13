import {Like} from "../models/Like.model.js"
import {Video} from "../models/Video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req,res)=>{

    const {videoId} = req.params

    const userId = req.user._id

    if(!videoId || !userId){
        throw new ApiError(400,"incorrect video or User Id")
    }
    
    const existingLike = await Like.findOne({
        video : videoId,
        likedBy : userId
    })

    if(existingLike){
        await Like.deleteOne(
            { 
                _id: existingLike._id 
            }
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200,null,"like removed")
        )
    }
    else{
        const newLike = await Like.create({
            video : videoId,
            likedBy : userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,newLike,"liked")
        )
    }

})

const toggleCommentLike = asyncHandler(async (req,res)=>{

    const {commentId} = req.params

    const userId = req.user._id

    if(!commentId || !userId){
        throw new ApiError(400,"incorrect comment or user id")
    }

    const existingLike = await Like.findOne({
        comment : commentId,
        likedBy : userId
    })

    if(existingLike){
        await Like.deleteOne(
            { 
                _id: existingLike._id 
            }
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200,null,"like removed")
        )
    }
    else{
        const newLike = await Like.create({
            comment : commentId,
            likedBy : userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,newLike,"liked")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req,res)=>{

    const {tweetId} = req.params

    const userId = req.user._id

    if(!tweetId || !userId){
        throw new ApiError(400,"incorrect tweetId or UserId")
    }

    const existingLike = await Like.findOne({
        tweet : tweetId,
        likedBy : userId
    })

    if(existingLike){

        await Like.deleteOne(
            { 
                _id: existingLike._id 
            }
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200,null,"like removed")
        )
    }
    else{
        const newLike = await Like.create({
            tweet : tweetId,
            likedBy : userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,newLike,"liked")
        )
    }
})

const getLikedVideos = asyncHandler(async (req,res)=>{

    const userId = req.user._id

    if(!userId){
        throw new ApiError(400,"incorrect user id")
    }

    // Find all like documents associated with the user

    //i have used liked elements bcz we are actually fetching based on userId as in our likes model we have stored many things such as liked comments , liked tweets and liked videos so that's why instead of using likedVideos i have used likedElements

    const likedElements = await Like.find(
        { 
            likedBy: userId 
        }
    )

    console.log(likedElements);
    console.log("8888888")

    // Extract video IDs from the liked videos
    const videoIds = likedElements.map(like => like.video);

    console.log(videoIds)
    console.log("ggggggg")
    // Query the Video model to retrieve video documents using the extracted video IDs
    const videos = await Video.find(
        { 
            _id: { 
                $in: videoIds 
            } 
        }
    )

    console.log(videos)

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"liked videos fetched successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}