import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (UserId)=>{
    
    const user = await User.findById(UserId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    //storing refresh token in database
    //validateBeforeSave: false | this is used bcz we don't want to get asked for password every time we genearet tokens.

    user.refreshToken = refreshToken

    await user.save({ validateBeforeSave: false })

    return {accessToken,refreshToken}
}

const registerUser = asyncHandler(async (req,res)=>{

        //steps to follow

        //1.get user details from frontend✅
        //2. validation✅
        //3.chek if user already exists:username password✅
        //4.check for images ,avatar✅
        //5.upload them to cloudinary✅
        //6.create user object - i.e entry in database✅
        //7.remove password and refresh token from response✅
        //8.check if user is created✅
        //9.return res✅


    //1.get user details from frontend

    //taking things from frontend (if you are receiving data from json or form you'll get that data in req.body)

    const {fullName,username,email,password} = req.body

    
    //2. validation

    //down here basically checking if any field is empty or not if empty then call the ApiEroor from utils and disply the error and if all correct then do the rest.

    if([fullName,username,email,password].some((field)=> field?.trim() === "")){
        throw new ApiError(400,"all fields are required to be filled")
    }

    //2.1 Email validation (temporary if doesn't work then remove it)

    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //     throw new ApiError(400, "Invalid email format");
    // }

    //3.chek if user already exists:username password

    //checking if user is exit or not on the basis of username and email. (By using $or method we can check on the basis of multiple values.)

    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"user already exists")
    }
    // console.log(existedUser);

    //4.check for images ,avatar

    //req.files will give us two files avatar and coverImage
    //req.files.avatar will give me the data inside avatar
    //req.files.avatar[0] will give the info from avatar here used [0] bcz the values from avatar and coverImage are inside [{}] this so to to extract directly from [] this we used [0].
    //and finally req.files?.avatar[0]?.path this is used to get the exact path i.e ==> public\temp\draw.png

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path 
    
    // console.log(req.files);
    // console.log("hey");
    // console.log(req.files.avatar);
    // console.log("hey");
    // console.log(req.files.avatar[0]);
    // console.log("hey");
    // console.log(req.files.avatar[0].path);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

    //5.upload them to cloudinary

    //take the local path and upload the image to the cloudinary.

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(!avatar){
        throw new ApiError(400,"avatar is required");
    }

    //6.create user object - i.e entry in database

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    // console.log(user);


    //7.remove password and refresh token from response

    //mongo db always assign _id value to every entry that is been created in db, so by finding that id in db we can check if user is created or not, by using .select("-password -refreshToken") wierd syntax but that's what it is.here we have to remove what variables we don't want by using - sign as already all of them are selected.

    const createdUser = await User.findById(user._id).select([
        "-password -refreshToken"
    ])

    //8.check if user is created

    if(!createdUser){
        throw new ApiError(500,"something went wrong while regestering user");
    }


    return res.status(201).json(
         new ApiResponse(200,createdUser,"user registered succesfully")
    )
    
})

const loginUser = asyncHandler(async (req,res)=>{
    //steps
    
    //1.req data from ==> req.body
    //2.verify based on email or password
    //3.find the user
    //4.password check
    //5.grant access and refresh tokens
    //6.send cookies

    //1.req data from ==> req.body

    const {username,password,email}=req.body

    //2.verify based on email or password

    if(!(username || email)){
        throw new ApiError(400,"email or username is required")
    }

    //3.find the user

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user not found")
    }

    //4.password check

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid login credentials")
    }

    //5.grant access and refresh tokens
    //for this create a saperate method (above ☝️)

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    //6.send cookies

    const loggedInUser = await User.findById(user._id).select([
        "-password -refreshToken"
    ])

    //options object is used bcz , we don't want that anyone from frontend to modify what is inside cookies
    const options = {
        httpOnly : true,
        secure : true
    }

    //in below return statement we are returning refresh and access token twice inside .cookie and inside .json also this is bcz the first one is for saving cookies on frontend but second one is for , if a user is developing a mobile app for that reason he is storing that on localstorage so that's why twice
    console.log(loggedInUser);
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user: loggedInUser,accessToken,refreshToken
        },"User logged in Successfully")
    )

})

const logoutUser = asyncHandler(async (req,res)=>{
    //for logging out we actually can't access the user is cuz we don't know who is logging out so we use middlewares for that,so go to ==> middlewares

    //now finally we have found out who wants to logout now reset the refreshToken to undefined

    await User.findByIdAndUpdate(
        req.user._id,
        {   
            $set :{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const option = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new ApiResponse(
            200,
            {},
            "User Logged Out")
        )

})

const refreshAccessToken = asyncHandler(async (req,res)=>{

    //when user's access token is expired so for refreshing it's access token we use this method

    //as we are supposed to refresh the access token so for that we need to compare the refresh token from database with the one user has provided

    //so in order to access the user's refresh token we use req.cookies
    //and req.body is used bcz a user might be sending the request from a mobile or something

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401,"invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
    }

    const options = {
        httpOnly : true,
        secure : true
    }
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
         new ApiResponse(
            200,
            {accessToken,newRefreshToken},
            "Access token refreshed Successfully"
         )
    )
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    //now we want to change the user's current password in case user want's to so for that we should have a user , now the user will come from ==> if the user wants to change the password then he must be logged in this means the auth middleware must have been executed so if that auth middleware is executed then in that there is a line req.user = user means req.user must have access to that user..

    const {oldPassword,newpassword} = req.body

    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(401,"Invalid User")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }

    user.password = newpassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Password updated Successfully")
    )
})

const getCurrentUser = asyncHandler (async (req,res)=>{
    
    // const user =await User.findById(req.user?._id)

    // return res
    // .status(200)
    // .json(
    //     new ApiResponse(200,user,"User Fetched Successfully")
    // )

    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"User Fetched Successfully")
    )
})

const updateUserDetails = asyncHandler (async (req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"all fields are required")
    }

    const user  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName : fullName,
                email : email
            }
        },
        {new : true}
        //new :true bcz it will return the updated value so we have stored that inside user
    ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"Details updated Successfully")
        )
})

const updateUserAvatar = asyncHandler (async (req,res)=>{

    const avatarLocalPath = req.file?.path
    // console.log(req.file);

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading Avatar")
    }

    //we use $set bcz we want to channge only selected values

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
        ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler (async (req,res)=>{

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage")
    }

    //we use $set bcz we want to channge only selected values

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }
        ).select("-password")

        
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverImage updated successfully")
    )
})

const getUserChannelDetails = asyncHandler(async (req,res)=>{

    //we actually have every detail regarding user but we don't have the details regarding subscription so for that reason we have created this controller

    // basically this controller returns how many subscribers do we have and how many channels we have subscribed

    //username is found in urls to get that username from url we use req.params

    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing");
    }

    //aggregation pipeline returns an array

    //we want to fetch details that how many peoples we have subscribed and who have subscribed to our channel so aggregation pipeline is used bcz we don't know the user so to take user deatils from User model We have joined user model and subscription models so that's why we have used aggregation pipelining.
    
    const channel = await User.aggregate([
        {
            $match : {
                //the username that we have extracted from the url will be matched with one we have in the db
                username : username?.toLowerCase()
            }
        },
        {
            //pipeline for counting subscribers of a channel
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            //pipeline for counting how many channel's we have subscribed
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                subscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
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
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1
            }
        }
    ])
    
    if(!channel?.length){
        throw new ApiError(400,"channel does not exists")
    }

    return res
    .status(200)
    .json(
        //channel[0] ==> "C:\Users\Vishal\OneDrive\Pictures\Screenshots\Screenshot (40).png"
        //mainly bcz aggregation piplelines returns an array of object so the 0th object (i.e is first) is the desired output so we use channel[0]

        new ApiResponse(200,channel[0],"channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req,res)=>{

    const user = await User.aggregate([

        //we are using nested pipeline bcz when we want some of the fields from one collection to be added to the other collection thats why we use lookup

        //1st pipeline : basically we are matching docs through _id from video and watchHistory from user model. Now in that which ever docs's will match _id from user and id's from watchHistory array those docs will be added to watchHistory(how? cuz we have written this ==> as : "watchHistory")
        {
            $match : {
                //id is taken like this bcz id's in mongo db are stored in string form so to covert it to id we use this ==> new mongoose.Types.ObjectId(req.user._id)

                //usually when we access id, mongoose automatically covert it from string to id but pipeline doesn't do it so we have to do it manually
                
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            //in this when we say "as" then actually that "as" field will contain the matching documents from both collections i.e users and videos as an array named "watchHistory"
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline: [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                },
                            //    { 
                            //         $addFields : {
                            //             owner : {
                            //                 $first : "$owner"
                            //             }
                            //         }
                            //     }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    console.log(user);
    console.log(user[0].watchHistory);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched Successfully"
        )
    )
})




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelDetails,
    getWatchHistory
}