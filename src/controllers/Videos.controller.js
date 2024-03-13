import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/Video.model.js";
import { View } from "../models/videoView.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import mongoose from "mongoose";
import { User } from "../models/User.model.js";

const getAllVideos = asyncHandler (async (req,res)=>{

    // //basically the idea is if user searches keyword then we are matching it with the tite or description stored in videos model using regex i.e regular expression

    // //limit=10 means every page has 10 videos

    const {page=1,limit=10,query,sortBy,sortType} = req.query


    let mongooseQuery = Video.find();

    // Add query conditions if provided
    if (query) {
        const searchRegex = new RegExp(query, 'i');
        mongooseQuery = mongooseQuery.find({
            $or :[{title : searchRegex},{description : searchRegex}]
        });
    }

    // Sort by
    if (sortBy) {
        let sortQuery = {};
        sortQuery[sortBy] = sortType === 'desc' ? -1 : 1;
        mongooseQuery = mongooseQuery.sort(sortQuery);
    }

    // Pagination
    const skip = (page - 1) * limit;
    mongooseQuery = mongooseQuery.skip(skip).limit(limit);

    // Execute the query
    const videos = await mongooseQuery.exec();

    if(videos.length == 0){
        return res
        .status(200)
        .json(
        new ApiResponse(200,"videos not found")
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,videos,"videos fetched")
        )
})

const publishAVideo = asyncHandler(async (req,res)=>{
    // TODO: get video, upload to cloudinary, create video
    const {title ,description} = req.body

    const user = req.user._id

    //checking if video has title and description

    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"required title and description")
    }

    //getting the local filepath 

    const videoLocalPath = req.files?.videoFile[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400,"video is required")
    }

    //uploading it on cloudinary

    const videoFile = await uploadOnCloudinary(videoLocalPath)

    if(!videoFile){
        throw new ApiError(400,"video is required")
    }

    //getting video thumbnail

    const videoThumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoThumbnailLocalPath){
        throw new ApiError(400,"thumbanil is required")
    }

    //upload thumbnail on cloudinary

    const thumbanil = await uploadOnCloudinary(videoThumbnailLocalPath)

    if(!thumbanil){
        throw new ApiError(400,"thumbnail is required")
    }

    //entering video and thumbnail into database

    const video = await Video.create({
        title,
        description,
        videoFile : videoFile.url,
        thumbnail : thumbanil.url,
        duration : videoFile.duration,
        owner: user
    })

    ///for views

    const session = req.session;
    const videoId = video._id.toString();
    const now = Date.now();

    // Check if session and session.videoViews are defined
    if (session && session.videoViews && (!session.videoViews[videoId] || now - session.videoViews[videoId] > 10000)) {
    // Increment view count only if the view is not from the same session or if the previous view occurred more than 1 hour ago
    video.views += 1;
    await video.save();

    // Store the current time as the last viewed time for this video in the session
    if (!session.videoViews) {
        session.videoViews = {};
    }
    session.videoViews[videoId] = now;
    req.session.save(); // Save the session
    }

    const createdVideo = await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(500,"something went wrong while uploading video")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200,video,"video uploaded successfully")
    )

})

const getVideoById = asyncHandler(async (req,res)=>{

    const {videoId} = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"incorrect id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video fetched successfully")
    )
})

const updateVideoDetails = asyncHandler(async (req,res)=>{

    //for updating title, description and thumbnail

    const {videoId} = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"incorrect id")
    }


    const {title,description,thumbnail} = req.body

    // if(!title || !description || !thumbnail){
    //     throw new ApiError(400,"all fields are required")
    // }

    const videoThumbnailLocalPath = req.file?.path

    if(!videoThumbnailLocalPath){
        throw new ApiError(400,"thumbnail is required")
    }

    const updatedThumbnail = await uploadOnCloudinary(videoThumbnailLocalPath)

    if(!updatedThumbnail.url){
        throw new ApiError(400,"error while uploading thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title : title,
                description : description,
                thumbnail : updatedThumbnail.url
            }
        },
        {
            new : true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Details updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req,res)=>{

    const {videoId} = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"incorrect id")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(404,"video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,"video deleted Successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req,res)=>{

    const {videoId} = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"incorrect id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,`Publish status of video toggled successfully. New status: ${video.isPublished ? 'Published' : 'Unpublished'}`)
    )
})

const viewVideo = asyncHandler(async (req,res)=>{

    const userId = req.user._id

    const {videoId} = req.params

    if(!userId){
        throw new ApiError(400,"incorrect userId")
    }

    if(!videoId){
        throw new ApiError(404,"incorrect videoId")
    }

    const hasUserViewed = await View.exists({
        video : videoId,
        viewer : userId
    })

    if(!hasUserViewed){
        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $inc : {
                    views : 1
                }
            },
            {
                new : true
            }
        )
        await View.findOneAndUpdate(
            { 
                video: videoId 
            },
            { 
                $addToSet: { 
                    viewer: userId 
                } 
            }, // Add userId to the viewer array if it doesn't already exist
            { 
                upsert: true, 
                new: true 
            }
        );

        return res
        .status(200)
        .json(
            new ApiResponse(200,video,"video watched successfully")
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,null,"video already watched")
    )

})

const watchTheVideo = asyncHandler(async (req,res)=>{

    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400,"incorrect video id")
    }

    const userId = req.user._id

    if(!userId){
        throw new ApiError(400,"incorrect user id")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404,"user not found")
    }

    if(user.watchHistory.includes(videoId)){
        return res
        .status(200)
        .json(
            new ApiResponse(200,"already watched")
        )
    }

    await User.findByIdAndUpdate(
        userId,
        {
            $addToSet : {
                watchHistory : videoId
            }
        },
        {
            new : true
        })
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc : {
                views : 1
            }
        },
        {
            new : true
        }
    )

    await View.findOneAndUpdate(
        { 
            video: videoId 
        },
        { 
            $addToSet: { 
                viewer: userId 
            } 
        }, // Add userId to the viewer array if it doesn't already exist
        { 
            upsert: true, 
            new: true 
        }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,null,"added to watch history")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    deleteVideo,
    togglePublishStatus,
    viewVideo,
    watchTheVideo
}