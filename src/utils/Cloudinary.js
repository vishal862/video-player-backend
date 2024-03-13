import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
 
//this configuration will give the permissin to upload files on cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



const uploadOnCloudinary = async(localfilepath)=>{
    try {
        if(!localfilepath) return null
        //upload on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto'
        })

       //this response contains lots of things such image width,height,format i.e jpg or png,bytes ,url and all
        // console.log(response);
         //to delete files from local Storage
        fs.unlinkSync(localfilepath);

        return response;
    } catch (error) {
        fs.unlinkSync(localfilepath)

        // console.error("Error uploading file to Cloudinary:", error);
        
        //this will delete the files from the server i.e locally stored files once they are uploaded or in some cases they are corrupted
        return null
    }
}



export {uploadOnCloudinary}


