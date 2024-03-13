import  {User} from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt from "jsonwebtoken";
//now this middleware ensures that if the user exists or not


//now we want to find out who wants to logout
//step 1. find out the token from req and res as we have access to cookies that we have provided in index.js by app.use(cookieparser())
//step 2. decode that token by using our ACCESS_SECRET_TOKEN and store it
//step 3. now that decoded token will have access to _id cuz _id is used while generating that token

// _ is used instead of res as res was not in use

export const verifyJWT = asyncHandler(async (req, _ ,next)=>{
    try {
        //step 1. find out the token from req and res as we have access to cookies that we have provided in index.js by app.use(cookieparser())
    
        // req.header("Authorization")?.replace("Bearer ","") this is for what if we don't have access to cookies cuz in some cases a user might be sending an custom header , now that custom token will be in (Authorization: Bearer <token>) this form so we just want token so we replace that "Bearer " with "" so we will get only token..😊
    
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        //step 2. decode that token by using our ACCESS_SECRET_TOKEN and store it
        if(!token){
            throw new ApiError(401,"Unauthorized token")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        //step 3. now that decoded token will have access to _id cuz _id is used while generating access token
    
        const user = await User.findById(decodedToken?._id).select([" -password -refreshToken"])
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        //req is an object which has lots of things so in that lots of things user will be added

        //When you do req.user = user, you are not overwriting an existing user property on the req object because, by default, it doesn't exist. Instead, you are adding a new property named user to the req object and assigning it the value of the user object. This is a common practice in Express.js for attaching custom data or metadata to the request object.
        
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})

export default verifyJWT