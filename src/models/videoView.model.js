import mongoose, { Schema } from "mongoose";

const videoViewSchema = new Schema({

    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },

    viewer : [{
        type : Schema.Types.ObjectId,
        ref : "User"
    }]
})

export const View = mongoose.model("View",videoViewSchema)