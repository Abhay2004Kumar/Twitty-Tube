import mongoose from "mongoose";
import {Comment} from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

import { Comment } from "../models/comment.models.js";
import {Video}  from "../models/video.models.js"
import {Like} from "../models/like.models.js"


const createComment = asyncHandler(async (req,res)=> {
    //get all comments for a video
    const { content } = req.body;
    const { videoId } = req.params;

    if(!content) {
        throw new ApiError(400," Provide the content ")
    }

    if(!videoId){
        throw new ApiError(400,"Please provide the video!!!")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video does not exist!")
    }

    const comment = await Comment.create(
        {
            content,
            videoId: videoId,
            uploader: req.user?._id
        },
        {
            new: true
        }
    )

    if(!comment){
        throw new ApiError(400,"Unable to add a comment")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201,comment,"Comment added succesfully")
    )

})

const updateComment = asyncHandler(async (req,res) => {
    const {content} = req.body
    const {commentId} = req.params

    if ([content, commentId].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Please provide the content,videoId,commentId");
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400,"Comment does not exists!!!")
    }

    if(comment.owner?.toString() !== req.user?._id?.toString()){
        throw new ApiError(400,"User not authorized to update the comment");
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content,
            }
        },
        {
            new : true
        }
    )

    if(!updateComment){
        throw new ApiError(400, " unable to update the comment")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                updateComment,
                "Comment update successfully"
            )
        )

})


const deleteComment = asyncHandler( async (req, res) => {

    const { commentId } = req.params;
    
    if(!commentId){
        throw new ApiError(400,"Provide the comment")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"Comment not exist");
    }

    if(comment.uploader?.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"User not authorized to delete this comment");
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if(!deleteComment){
        throw new ApiError(400,"comment not deleted");
    }

    const deletedLike = await Like.deleteMany(
        {
            comment : commentId,
            owner : req.user._id,
        }
    )

    if(!deletedLike){
        throw new ApiError(400,"unable to delete the like of the comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Comment successfully deleted"

            )
        )

}) 

const getAllCommentVideo = asyncHandler( async (req,res) => {

    const { videoId } = req.params;
    const { page = 1, limit = 10} = req.query;

    const options  = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    if(!videoId){
        throw new ApiError(400,"Please provide the video")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not found");
    }

    const getAllComment = await Comment.aggregate(
        [
            {
                $match : {
                    video : new mongoose.Types.ObjectId(videoId)
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
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "comment",
                    as : "likes"
                }
            },
            {
                $addFields : {
                    totalLikes : {
                        $size : "$likes"
                    },
                    owner : {
                        $first : "$uploaderDetails"
                    }
                }
            },
            {
                $sort : {
                    createdAt : -1
                }
            },
            {
                $project  : {
                    content : 1,
                    uploader: {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalLikes : 1,
                    createdAt : 1
                }
            }
            
        ]
    );

    if(!getAllComment.length === 0){
        throw new ApiError(400,"No comment found");
    }

    const response = await Comment.aggregatePaginate(
        getAllComment,
        options
    )

    if(!response) {
        throw new ApiError(400,"unable to get the comment")
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "Comment get successfully"
            )
        )
})

export {
    createComment,
    updateComment,
    getAllCommentVideo,
    deleteComment,
}


