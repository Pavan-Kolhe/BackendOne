import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweet = await Tweet.create({
    content: req.body.content,
    owner: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const user = await User.findById(req.params);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: user._id,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const content = req.body.content;
  const tweet = await Tweet.findById(req.params.tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  tweet.content = content;
  await tweet.save({ validationBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const tweet = await Tweet.findById(req.params.tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  await tweet.remove();
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
