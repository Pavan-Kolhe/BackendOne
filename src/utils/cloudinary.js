
/* goal ->
reusable code hai
goal -> server pe file aa chuki hai that will give  local
path fir use  cloudinary pe upload karna hai  if succesful then
server se delete karna hai
*/

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //now file is uploaded successfully
        console.log("file is uploaded cloudinary",response.url);     
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally
        //saved temporary file on server as the upload operation
        //got failed
        return null;
    }
}

export {uploadOnCloudinary}