import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const like = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (like) {
    await like.remove();
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  const like = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (like) {
    await like.remove();
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  const like = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (like) {
    await like.remove();
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
