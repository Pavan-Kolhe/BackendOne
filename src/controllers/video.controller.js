import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOldFile, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = -1,
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // SchemaModel.find(query)  =>  query is object |
  // eg : query = { _video : videoId }

  //userstanding regex notes are at the bottom

  const filter = {
    owner: userId,
  };
  if (query && query.trim() !== "") {
    filter.title = { $regex: query, $options: "i" };
  }
  const videos = await Video.find(filter)
    .sort({ [sortBy]: parseInt(sortType) })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));
  if (!videos) {
    throw new ApiError(404, "No videos found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos found successfully"));
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

//userstanding regex
// MongoDB $regex — Important Notes
// What is $regex?
// $regex is used to perform pattern-based text searches in MongoDB.
// Helps find partial matches, case-insensitive matches, etc.
// Basic Syntax
// Edit
// { field: { $regex: "pattern", $options: "i" } }
// field: The document field to search (e.g., title)

// "pattern": Text or pattern to match

// $options: "i": Makes the search case-insensitive

// Common Use Cases and Patterns

// Contains text:
// { title: { $regex: "fun", $options: "i" } }
// → Matches: "fun time", "Funny moments"

// Exact match (case-insensitive):
// { title: { $regex: "^fun$", $options: "i" } }
// → Matches: only "fun"

// Starts with:
// { title: { $regex: "^fun", $options: "i" } }
// → Matches: "Funny video", "fun time"

// Ends with:
// { title: { $regex: "fun$", $options: "i" } }
// → Matches: "Let's have fun"

// Contains a number:
// { title: { $regex: "\\d" } }
// → Matches: "Video 123", "Part 9"

// Only letters (no digits or symbols):
// { title: { $regex: "^[A-Za-z]+$", $options: "i" } }
// → Matches: "HelloWorld"

// Contains whole word:
// { title: { $regex: "\\bfun\\b", $options: "i" } }
// → Matches: "Have fun" (not "funny")

// When to Use $regex

// ✅ For partial text searches (search bars, filters)
// ✅ When case-insensitive match is needed
// ❌ Avoid for exact ID or performance-critical queries

// Performance Tip
// Regex starting with ^ can use indexes.
// Regex without ^ may be slow on large collections.

// Task	Use This
// Simple search (small app)	MongoDB $regex or $text
// Scalable, fast search	Elasticsearch / Meilisearch
// Smart suggestions	ML + full-text + user behavior
