import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/Subscription.model.js";
import { User } from "../models/User.model.js";

const toggleSubscription = asyncHandler(async (req,res)=>{

    //this ciontroller is used to subscribe to a channel or unsubscribe

    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(404,"Channel id not found")
    }

    const userId = req.user._id

    if(!userId){
        throw new ApiError(404,"user not found")
    }

    const isSubscribed = await Subscription.exists({
        channel : channelId,
        subscriber : userId
    })

    if(isSubscribed){
        await Subscription.findOneAndDelete({
            channel : channelId,
            subscriber : userId
        })

        return res
        .status(200)
        .json( 
            new ApiResponse(200,"Unsubscribed Successfully")
            )
    }
    else{
        await Subscription.create({
            channel : channelId,
            subscriber : userId
        })

        return res
        .status(200)
        .json( 
            new ApiResponse(200,"Subscribed Successfully")
            )
    }

})

const getUserChannelSubscribers = asyncHandler(async (req,res)=>{

    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(404,"channel not found")
    }

    const subscriptions = await Subscription.find({
        channel : channelId
    })

    if(!subscriptions || subscriptions.length === 0){
        throw new ApiError(404,"no subscribers found")
    }

    const subscriberIds = subscriptions.map(subscription => subscription.subscriber);

    //In short, it retrieves all users who have subscribed to the channel(s) specified by their IDs stored in the subscriberIds array.

    const subscribers = await User.find(
        {
            _id : {
                $in : subscriberIds
            }
        }
    ).select("-password -email -watchHistory -avatar -coverImage -createdAt -updatedAt -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribers,"subscribers reterived successfully")
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {

    const { subscriberId } = req.params;

    if(!subscriberId){
        throw new ApiError(404,"channel not found")
    }

    // Retrieve subscriptions for the given subscriber
    const subscriptions = await Subscription.find({ subscriber: subscriberId });

    // Extract channel IDs from subscriptions
    const channelIds = subscriptions.map(subscription => subscription.channel);

    // Query the User collection to get details of subscribed channels
    const subscribedChannels = await User.find({ _id: { $in: channelIds } }).select("-refreshToken -password -watchHistory -email -fullName -createdAt -updatedAt")

    return res.
    status(200).
    json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}