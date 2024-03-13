import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//dot env is used bcz we want that when we run the code all the variables from .env should load first so we use this method

dotenv.config({
    path:"./.env"
})

const app = express();

( async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       //below line is for if for some reasons db is connected but it is not able to talk to the mongoose then throw error
       app.on("error",(error)=>{
            console.log("error:",error)
            throw error
       })
       app.listen(process.env.PORT,()=>{
        console.log(`⚙️  app is listening on port : ${process.env.PORT}`)
       })
    } catch (error) {
        console.error("Mongodb Connection error ❌ ",error)
        process.exit(1)
    }
})()

import userRouter from "./routes/User.routes.js";
import videoRouter from "./routes/Video.routes.js"
import subscriptionRouter from "./routes/Subscription.routes.js"
import playlistRouter from "./routes/Playlist.routes.js"
import commentRouter from "./routes/Comment.routes.js"
import tweetRouter from "./routes/Tweet.routes.js"
import healthCheckRouter from "./routes/Healthcheck.routes.js"
import likeRoute from "./routes/Like.routes.js"
import dashboardRoute from "./routes/Dashboard.routes.js"


//since router is in another folder so to bring router here we have to use middleware
//so as we go to the /user route the control will go to the user route. here==>./routes/User.routes.js-->continue in that file

///api/v1/user bcz we might release version 2

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/healthcheck",healthCheckRouter)
app.use("/api/v1/likes",likeRoute)
app.use("/api/v1/dashboard",dashboardRoute)