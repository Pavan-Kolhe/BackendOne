/* goal ->
reusable code hai
goal -> server pe file aa chuki hai that will give  local
path fir use  cloudinary pe upload karna hai  if succesful then
server se delete karna hai
*/

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //now file is uploaded successfully
    //console.log("file is uploaded cloudinary",response.url);
    fs.unlinkSync(localFilePath); // once file is uploaded we like to remove it from server
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally
    //saved temporary file on server as the upload operation
    //got failed
    return null;
  }
};
const deleteOldFile = async (url, type = "image") => {
  // public url
  try {
    const parts = url.split("/");
    const fileName = parts[parts.length - 1]; // e.g., abc123.jpg
    const publicId = fileName.split(".")[0]; // abc123

    console.log(`Deleting ${type} with publicId: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: type, // "image" or "video"
    });
    console.log("Deleted :", result);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error);
    throw error;
  }
};

export { uploadOnCloudinary, deleteOldFile };
