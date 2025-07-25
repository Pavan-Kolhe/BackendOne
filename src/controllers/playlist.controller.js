import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  // no idea how videos array will come from frontend
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Playlist cannot be created");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  const playlists = await Playlist.find({ owner: userId });
  if (!playlists) {
    throw new ApiError(404, "Playlists not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists found successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist found successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const updatedPl = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId }, //$push: Adds the video ID to the videos array.
    },
    {
      new: true,
    }
  );

  if (!updatedPl) {
    throw new ApiError(500, "Playlist cannot be updated (video add)");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPl, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  const updatedPl = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId }, //$pull: removes the video ID to the videos array.
    },
    {
      new: true,
    }
  );

  if (!updatedPl) {
    throw new ApiError(500, "Playlist cannot be updated (remove video)");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPl,
        "Video Removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  playlist.name = name;
  playlist.description = description;
  await playlist.save({ validationBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
