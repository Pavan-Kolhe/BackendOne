import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const totalVideosAndLikes = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "totallikes",
      },
    },
    {
      $addFields: {
        likeCount: { $size: { $ifNull: ["$likes", []] } },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
        totalLikes: { $sum: "$likeCount" },
      },
    },
    {
      $project: {
        _id: 0,
        totalLikes: 1,
        totalVideos: 1,
        totalViews: 1,
      },
    },
  ]);
  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscribers: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        totalSubscribers: 1,
      },
    },
  ]);
  console.log(totalVideosAndLikes);
  console.log(totalSubscribers);

  return res.status(200).json({
    totalVideosAndLikes: totalVideosAndLikes[0],
    totalSubscribers: totalSubscribers[0],
  });
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const videos = await Video.find({ owner: user._id }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos found successfully"));
});

export { getChannelStats, getChannelVideos };
