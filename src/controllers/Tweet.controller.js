import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Tweet } from "../models/Tweets.model.js"

const createTweet = asyncHandler(async (req,res)=>{
    
    const {content} = req.body

    const userId = req.user._id

    if(!userId){
        throw new ApiError(404,"user not found")
    }

    if(!content){
        throw new ApiError(400,"required content")
    }

    const createdTweet = await Tweet.create({
        content : content,
        owner : userId
    })

    if(!createdTweet){
        throw new ApiError(404,"tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,createdTweet,"tweet created successfully")
    )

})

const getUserTweets = asyncHandler(async (req,res)=>{

    const {userId} = req.params

    if(!userId){
        throw new ApiError(400,"incorrect userId")
    }

    const tweet = await Tweet.find({owner : userId})

    console.log(tweet)

    if(!tweet){
        throw new ApiError(400,"tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"tweet fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req,res)=>{

    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(404,"incorrect tweet id")
    }

    const {content} = req.body

    if(!content){
        throw new ApiError(400,"content missing")
    }

    const userId = req.user._id

    if(!userId){
        throw new ApiError(400,"incorrect userId")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set : {
                content : content
            }
        },
        {
            new : true
        }
    )

    if(!tweet){
        throw new ApiError(404,"tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req,res)=>{

    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(404,"incorrect tweet id")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}