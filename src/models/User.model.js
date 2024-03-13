import mongoose ,{Schema} from "mongoose";
import Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(

    {
        username:{
            type:String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
            //to make user searchable use it conciously as it using it in every field can be inappropriate
            index:true 
        },

        email:{
            type:String,
            required: true,
            unique:true,
            trim:true,
        },

        fullName:{
            type:String,
            required: true,
            trim:true,
            index:true
        },

        avatar:{
            type:String, //a url from cloudinary
            required: true,
        },

        coverImage:{
            type:String, //a url from cloudinary
        },

        watchHistory:[
            //watchHistory is an array bcz we are going to store multiple values in it as a user won't watch only one video so that's why an array is used.
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],

        password:{
            type:String, 
            required:[true,"password is required"],
        },

        refreshToken:{
            type:String, 
        }
    
    },
    {
        timestamps:true
    })

//used down here a pre hook bcz it is used when we want to perform some operation just before saving it as pre hook gives this functionality, but if we make a little changes then it will again get called so to avoid that use if else.


userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10)
  next()
})
  
  userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
  }
  
  userSchema.methods.generateAccessToken = function () {
    return Jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    )
  }
  
  userSchema.methods.generateRefreshToken = function () {
    return Jwt.sign(
      {
        _id: this.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    )
  }

export const User = mongoose.model("User",userSchema)