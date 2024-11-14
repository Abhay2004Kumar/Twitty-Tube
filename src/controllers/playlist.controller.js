import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

import {User} from "../models/user.models.js"


const createPlaylist = asyncHandler(async (req, res) => {

    //TODO: create playlist
    const {name, description} = req.body

    if([name, description].some((field) => field.trim() === "")){
        throw new ApiError(400, "Please provide name and description");
    }


    const playlist = await Playlist.create(
        {
            name,
            description,
            uploader : req.user?._id
        },
        {
            new : true
        }
    )

    if(!playlist){
        throw new ApiError(400, "Unable to create playlist");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlist,
                "Playlist created successfully"
            )
        )
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400, "Please provide userId")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(400, "User does not exist!")
    }

    const userPlaylist = await Playlist.aggregate(
        [
            {
                $match : {
                    uploader : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "videos",
                    foreignField : "_id",
                    as : "videos"
                }
            },
            {
                $match : {
                    "$videos.isPublished" : true
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "uploader",
                    foreignField : "_id",
                    as : "uploaderDetails"
                }
            },
            {
                $addFields : {
                    totalVideos : {
                        $size : "$videos"
                    },
                    totalViews : {
                        $sum : "$videos.views"
                    },
                    video : {
                        $first : "$videos"
                    },
                    owners : {
                        $first : "$uploaderDetails"
                    }
                }
            },
            {
                $project : {
                    name : 1,
                    description : 1,
                    totalVideos : 1,
                    totalViews : 1,
                    video : {
                        thumbnail : 1,
                        videoFile : 1,
                        title : 1,
                        description : 1,
                        duration : 1,
                        views : 1,
                        isPublised : 1,
                        createdAt : 1,
                    },
                    uploaders : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    createdAt : 1,
                    updatedAt : 1,
                }
            }
        ]
    );

    if(userPlaylist.length === 0){
        throw new ApiError(400, "User not exists | playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userPlaylist,
                "Playlist found successfully"
            )
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400, "Please provide the playlist id");
    }    

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "Playlist not found | exist");
    }

    const playlistList = await Playlist.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId)
            },
            
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos"
            }
        },
        {
            $match : {
                "$videos.isPublished" : true
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "uploader",
                foreignField : "_id",
                as : "uploaderDetails"
            }
        },
        {
            $addFields : {
                totalViews : {
                    $sum : "$videos.views"
                },
                video : {
                    $first : "$videos"
                },
                uploaders : {
                    $first : "$uploaderDetails"
                }
            }
        },
        {
            $project : {
                name : 1,
                description : 1,
                totalViews : 1,
                video : {
                    thumbnail : 1,
                    videoFile : 1,
                    title : 1,
                    description : 1,
                    duration : 1,
                    views : 1,
                    isPublised : 1,
                    createdAt : 1,
                },
                uploaders : {
                    username : 1,
                    fullName : 1,
                    avatar : 1      
                },
                createdAt : 1,
                updatedAt : 1,
            }
        }
    ])

    if(playlistList.length === 0){
        throw new ApiError(400, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistList,
                "Playlist found",
            )
        )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if([playlistId,videoId].some((field) => field.trim() === "")){
        throw new ApiError(400,"Please provide playlistId and videoId");
    }     

    const videoExist = await Video.findById(videoId);

    if(!videoExist){
        throw new ApiError(400,"Video not exist in Our record");
    }

    const playlist = await Playlist.findById(playlistId);
    if(playlist?.uploader?.toString() !== req.user?._id?.toString()){
        throw new ApiError(400, "user not authorised to access")
    }

    const playlistExist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push : {
                videos : videoId,
            }
        },
        {
            new : true
        }
    )

    if(!playlistExist){
        throw new ApiError(400, " Unable to add videos on the playlist ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistExist,
                "Video added on the Playlist Successfully"

            )
        )



})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if([playlistId,videoId].some((field) => field.trim() === "")){
        throw new ApiError(400,"Please provide playlistId and videoId");
    } 
    
    const videoExist = await Video.findById(videoId);

    if(!videoExist){
        throw new ApiError(400,"Video not exist in Our record");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400,"Playlist not exist | not found");
    }

    if(playlist?.uploader?.toString() !== req.user?._id?.toString()){
        throw new ApiError(400,"User not authrized to remove the video form the playlist")
    }

    const playlistExist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull : {
                videos : videoId,
            }
        },
        {
            new : true
        }
    )

    if(!playlistExist){
        throw new ApiError(400, " Unable to delete videos from the playlist ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistExist,
                "Video deleted from the Playlist Successfully"

            )
        )
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400,"Please provide the Playlist Id");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if(playlist?.uploader?.toString() !== req.user?.toString()){
        throw new ApiError(400,"User not authorized to delete the Playlist")
    }

    if(!playlist){
        throw new ApiError(400,"Unable to deleted the Playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Playlist deleted Successfully"
            )
        )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if([playlistId].some(field => field.trim() === "")){
        throw new ApiError(400,"Please provide the playlist Id");
    }

    if(!name && !description){
        throw new ApiError(400,"Please provide atleast one name and description");
        
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400,"Playlist not exist | not found");
    }

    if(playlist.uploader?.toString() !== req.user?._id?.toString()){
        throw new ApiError(400,"User not authorized to update this Playlist");
    }

    if(name){
        playlist.name = name;
    }

    if(description){
        playlist.description = description;
    }

    await playlist.save();

    const response = await Playlist.findById(playlist);

    if(response.name.toString() !== name.toString()){
        throw new ApiError(400,"Unable to update the playlist Details");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "Playlist updated Successfullly"
            )
        )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}