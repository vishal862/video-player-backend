import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Comment } from "../models/Comment.model.js"
import { Video } from "../models/Video.model.js"
import mongoose from "mongoose"


const addComment = asyncHandler(async (req, res) => {

    const {videoId} = req.params

    const {content} = req.body

    if(!videoId || !content){
        throw new ApiError(400,"video id and content are required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }

    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.params._id
    })

    if(!comment){
        throw new ApiError(400,"comment not found")
    }

    const addedComment = await Video.aggregate([
        { 
            $match: { 
                _id: new mongoose.Types.ObjectId(videoId) 
            } 
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $project : {
                videoFile : 1,
                title : 1,
                description : 1,
                owner : 1,
                comments : 1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200,addedComment[0],"comment added successfully")
    )
})

const getVideoComments = asyncHandler (async (req,res)=>{

    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Incorrect video id");
    }

    const { page = 1, limit = 10 } = req.query;

    // Count total number of comments for the video
    const totalComments = await Comment.countDocuments({ video: videoId });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalComments / limit);

    // Calculate the number of comments to skip
    const skip = (page - 1) * limit;

    // Query comments for the video with pagination
    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 }) // Sort comments by creation date in descending order
        .skip(skip) // Skip comments based on the pagination parameters
        .limit(parseInt(limit)); // Limit the number of comments per page

    // Create a response object containing the comments for the current page
    const response = {
        comments,
        currentPage: page,
        totalPages
    };


    return res
    .status(200)
    .json(
        new ApiResponse(200,response,"Comments fetched successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params

    const {content} = req.body

    if(!commentId){
        throw new ApiError(404,"required videoId and commentId")
    }
    
    console.log(commentId)

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content : content
            }
        },
        {
            new : true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedComment,"comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req,res)=>{

    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404,"required commentId")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"comment deleted successfully")
    )
})

export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
}