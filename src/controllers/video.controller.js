import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOldFile, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  console.log("req.body", req.body);
  const { title, discription } = req.body;
  // TODO: get video, upload to cloudinary, create video
  console.log("req.files", req.files);
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  const videoObj = await uploadOnCloudinary(videoLocalPath);

  const thumbnailObj = await uploadOnCloudinary(thumbnailLocalPath);
  console.log("before creating video");

  try {
    const video = await Video.create({
      videoFile: videoObj.url,
      thumbnail: thumbnailObj.url,
      title,
      discription,
      duration: parseFloat(videoObj.duration),
      views: 0,
      isPublished: true,
      owner: req.user._id,
    });
    const createdVideo = await Video.findById(video._id);
    if (!createdVideo) {
      throw new ApiError(500, "Something went wrong while publishing a Video");
    }

    //returnig a Apiresponse

    return res
      .status(201)
      .json(new ApiResponse(200, createdVideo, "video published Successfully"));
  } catch (error) {
    if (videoObj) {
      await deleteOldFile(videoObj.public_id, "video");
    }
    if (thumbnailObj) {
      await deleteOldFile(thumbnailObj.public_id);
    }
    throw new ApiError(500, error.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const { title, discription } = req.body;
  video.title = title;
  video.discription = discription;
  console.log("req.files", req.file);
  const thumbnailLocalPath = req.file?.path;
  if (thumbnailLocalPath) {
    await deleteOldFile(video.thumbnail); // check deleted?
    const thumbnailObj = await uploadOnCloudinary(thumbnailLocalPath);
    video.thumbnail = thumbnailObj.url;
  } else console.log("thumbnail not found");
  await video.save({ validationBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  console.log("videofile", video.videoFile);
  console.log("thimbnail", video.thumbnail);

  await deleteOldFile(video.videoFile, "video"); // delete needs public url
  await deleteOldFile(video.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  video.isPublished = !video.isPublished;
  await video.save({ validationBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
