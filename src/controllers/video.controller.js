import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadCloudinary, deleteFromCloudinary} from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pageNum=parseInt(page)
    const limitNum=parseInt(limit)

    //pattern matching
    const filter = {}
    if(query){
        const regex= new RegExp(query,"i") // serach must be case insesititve
        filter.$or = [
            {title: regex},
            {description: regex},
        ]
    }

    if(userId){
        filter.uploder = userId
    }

    const sortOptions = {};

    if(sortBy){
        sortOptions[sortBy] = sortType === "asc"? 1: -1
    }

    console.log("sortOptions: ",sortOptions);

    try {
                // Video aggregation pipeline
                const videos = await Video.aggregate([
                    { $match: filter },
                    { $sort: sortOptions },
                    { $skip: (pageNum - 1) * limitNum },
                    { $limit: limitNum },
                    {
                        $lookup: {
                            from: "users",
                            localField: "uploader",
                            foreignField: "_id",
                            as: "uploader",
                            pipeline: [
                                { $project: { fullName: 1, username: 1, avatar: 1 } },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes",
                        },
                    },
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "video",
                            as: "comments",
                            pipeline: [
                                { $project: { content: 1, createdAt: 1, uploader: 1 } },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            likesCount: { $size: "$likes" },
                            commentCount: { $size: "$comments" },
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            uploader: 1,
                            duration: 1,
                            views: 1,
                            isPublised: 1,
                            comments: 1,
                            likesCount: 1,
                            commentCount: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ]);
        
                if (videos.length === 0) {
                    throw new ApiError(404, "Videos not found");
                }
        
                const totalVideos = await Video.countDocuments(filter);
                const totalPages = Math.ceil(totalVideos / limitNum);
        
                return res
                    .status(200)
                    .json(
                        new ApiResponse(
                            200, 
                            {
                                totalVideos,
                                totalPages,
                                currentPage: pageNum,
                                limit: limitNum,
                                videos,
                            },
                            "Videos fetched successfully"
                        )
                    );
        
    } catch (error) {
        console.error("Error loading videos",error);
        throw new ApiError(500, "Error from server side")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {
    const {
        title, description, isPublished
    } = req.body;

    
    // checking the title and description should not be empty...
    if([title,description].some((field) => {
        field.trim() === ""
    })){
        throw new ApiError(400, "Please provide full details");
    }

    const localPathVideoFile = req.files?.videoFile[0].path;

    const localPathThumbnail = req.files?.thumbnail[0].path;

    if(
        !localPathVideoFile || !localPathThumbnail
    ){
        throw new ApiError(400, "Please provide videoFile and thumbnail path");
    }

    //uploading video file in cloudinary
    let videoFile
    try {
       videoFile = await uploadCloudinary(localPathVideoFile)
       console.log("Video uploaded successfully :",videoFile.url, videoFile.duration); 
    } catch (error) {
        console.log("erroor in uploading video ", error);
    }

    let thumbnail;
    try {
        thumbnail = await uploadCloudinary(localPathThumbnail);
        console.log("Thumbnail file uploaded successfully on cloudinary :", thumbnail.url)
    } catch (error) {
        console.log("Error in uploading thumbnail on cloudinary", error);
    }

    //create a video
    try {
        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            uploader: req.user?._id,
            duration: videoFile.duration,
            isPublished
        })
        
        if(!video){
            throw new ApiError(400,"Video creation failed!!!");
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    {
                        video
                    },
                    "Video created successfully"
                )
            )
    } catch (error) {
        console.log("Some error has occured during creation: ",error);
        if(videoFile){
            await deleteFromCloudinary(videoFile.public_id);
            console.log("Video file deleted from the cloudinary...", videoFile.public_id)
        }

        if(thumbnail){
            await deleteFromCloudinary(thumbnail.public_id);
            console.log("Thumbnail file deleted from the cloudinary...", thumbnail.public_id)
        }

        throw new ApiError(500, "Internal server error")
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400, "Please provide videoId");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Videos with the Id not fetched!");
    }

    const getVideoById = await Video.aggregate(
        [
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(videoId)
                }
            },
            // get owner details
            {
                $lookup : {
                    from : "users",
                    localField : "uploader",
                    foreignField : "_id",
                    as : "uploader",
                    pipeline : [
                        {
                            $project : {
                                username : 1,
                                fullName : 1,
                                avatar : 1,
                                
                            }
                        },
                        
                    ]
                }
            },
            
            // get the likes of the videos
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "likes",
                }
            },
            // get the comments of the videos
            {
                $lookup : {
                    from : "comments",
                    localField : "_id",
                    foreignField : "video",
                    as : "comments",
                    pipeline : [
                        {
                            $project : {
                                content : 1,
                                uploader : 1,
                                createdAt : 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields : {
                    uploader : {
                        $first : "$uploader"
                    },
                    
                    likesCount : {
                        $size : "$likes"
                    },
                    commentsCount : {
                        $size : "$comments"
                    },
                    isLiked : {
                        $cond: [ // here below same as ternary operator works...
                            { 
                                $in: [req.user?._id, "$likes.likedBy"] 
                            },
                            true,
                            false
                        ]
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    duration: 1,
                    view: 1,
                    isPublished: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    likesCount: 1,
                    commentsCount: 1,
                    uploader: 1,
                    comments: 1,
                    isLiked: 1
                }
            }
        ]
    )

    if(getVideoById.length === 0){
        throw new ApiError(400, "Video not found");
    }

    console.log("Here is a getVideoById: " + JSON.stringify(getVideoById, null, 2));


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    getVideoById
                },
                "Video fetched successfully"
            )
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    //TODO: update video details like title, description, thumbnail

    if(!title && !description){
        throw new ApiError(400,"Please provide title or description")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Video does not exists!")
    }

    if(video?.uploder?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Authentication failed: Unauthorized user")
    }

    if(title){
        video.title = title;
    }

    if(description){
        video.description = description;
    }


    await video.save();


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    video
                },
                "Video updated successfully!"
            )
        )

})

const updateVideoThumbnail = asyncHandler( async (req,res) => {

    const { videoId } = req.params;

    const localPathThumbnail = req.file.path;

    if(!localPathThumbnail){
        throw new ApiError(400, "Please provide thumbnail path");
    }

    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(400, "Video not exists");
    }

    if(video?.uploader.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "You are not authorized to update this video");
    }

    if(video?.thumbnail){
        const publicId = video?.thumbnail?.split('/').pop().split('.')[0];
        console.log(publicId);
        await deleteFromCloudinary(publicId);
        console.log("Thumbnail file deleted of previous file from the cloudinary");
    }

    const thumbnail = await uploadCloudinary(localPathThumbnail);

    video.thumbnail = thumbnail.url;

    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    video
                },
                "Video thumbnail updated successfully"
            )
        )

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

    if(!videoId){
        throw new ApiError(400, "Please provide the video Id")
    }

    const videoExisted = await Video.findById(videoId)

    if(videoExisted?.uploader.toString() !== req.user._id.toString()){
        throw new ApiError(400, "Unauthorized access to the video")
    }

    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: !videoExisted.isPublished
            }
        },
        {
            new: true
        }
        )

    if(!video){
        throw new ApiError(400, "No video found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                video
            },
            "Publish toggled successfully"
        )
    )



})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateVideoThumbnail,
}