import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(400, "Please provide videoId to delete!")
    }

    const video = await Video.findById(videoId);
   
   if (!video) {
        return next(new ApiError(404, "Video not found"));
    }

    if(video?.uploder.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to delete this video");
    }

    try {
        // deleting the videoFile and thumbnail from the cloudinary before deleting the video

        const videoFilePublicId = video?.videoFile?.split("/").pop().split(".")[0];
        const thumbnailPublicId = video?.thumbnail?.split("/").pop().split(".")[0];

        const videoFileDeletefromCloud = await deleteFromCloudinary(videoFilePublicId);
        
        const thumbnailDeletefromCloud = await deleteFromCloudinary(thumbnailPublicId);
        
        console.log("Video file and thumbnail deleted from the cloudinary...",videoFileDeletefromCloud,thumbnailDeletefromCloud);
    } catch (error) {
        console.log("Error in deleting video from cloudinary", error);
        throw new ApiError(500, "Internal server error");
    }

    // deleting the video from the Video entity
    await Video.findByIdAndDelete(videoId);

    // deleting the video comment from the Comment entity
    await Comment.deleteMany(
        { 
            video: videoId,
            uploder: req.user._id
        }
    );

    // deleting the video likes from the likes entity
    await Like.deleteMany(
        { 
            video: videoId,
            likedBy: req.user._id 
            
        }
    );

    // deleting the video from the playlist entity
    await Playlist.deleteMany(
        {
            videos: videoId,
            uploder : req.user?._id,
            
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "Video Successfully deleted": video
                },
                "Video deleted successfully"
            )
        )



})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}