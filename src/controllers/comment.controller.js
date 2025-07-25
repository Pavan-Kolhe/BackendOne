import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  // .skip(20) → Tells the database to ignore the first 20 documents in the result set.
  //.limit(10) → After skipping, it returns only the next 10 documents.

  console.log("type of page", typeof page);
  console.log("type of limit", typeof limit);

  const comments = await Comment.find({ video: videoId })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit)) // offset  = (page - 1) * limit
    .limit(parseInt(limit));

  if (!comments) {
    throw new ApiError(500, "cannot get comments from server");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments found successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const videoId = req.params;
  const { content } = req.body;

  if (!content.trim()) {
    throw new ApiError(400, "Comment cannot be empty");
  }

  const comment = await Comment.create({
    content,
    owner: req.user._id,
    video: videoId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: req.body.content,
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(404, " Comment not found with id " + commentId);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(404, " Comment not found with id " + commentId);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
