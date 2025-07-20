import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (subscription) {
    const unsubscribe = await Subscription.findByIdAndDelete(subscription._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          unsubscribe,
          "Subscription toggled successfully(unsubscribed)"
        )
      );
  }

  const subscribe = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribe,
        "Subscription toggled successfully (subscribed)"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: "$subscriber",
      },
    },
    {
      $project: {
        _id: 0,
        subscriber: "$_id",
      },
    },
  ]);

  if (subscribers) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, subscribers, "Subscribers found successfully")
      );
  }

  return res
    .status(400)
    .json(new ApiError(400, "No subscribers found( invalid channel id)"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $group: {
        _id: "$channel",
      },
    },
    {
      $project: {
        _id: 0,
        channel: "$_id",
      },
    },
  ]);
  if (subscribedChannels) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          "Subscribed channels found successfully"
        )
      );
  }
  return res
    .status(400)
    .json(
      new ApiError(400, "No subscribed channels found( invalid subscriber id)")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
