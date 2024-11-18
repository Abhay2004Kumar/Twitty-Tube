import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import {Tweet} from "../models/tweet.models.js"

const getLikedTweets = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;

    const tweet = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "tweets",
                    localField : "tweet",
                    foreignField : "_id",
                    as : "tweet",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "uploader",
                                foreignField : "_id",
                                as : "uploader"
                            }
                        },
                        {
                            $addFields : {
                                uploader : {
                                    $first : "$uploader"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    tweet : {
                        $first : "$tweet"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totaltweet : {
                        $size : "$tweet"
                    }
                }
            },
            {
                $project : {
                    tweet : {
                        content : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        uploader : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totaltweet : 1
                }
            }

        ]
    )

    if(tweet.length === 0){
        throw new ApiError(400, "Likes not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Likes found successfully"
            )
        )

})

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400,"VideoId is not present!")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video does not exist!")
    }

    const like = await Like.findOne(
        {
            video: videoId,
            likedBy: req.user._id
        },
        {
            new:true
        }
    )

    if(like){
        await Like.findByIdAndDelete(like._id)
    }else{
        const newLike = await Like.create(
            {
                video: videoId,
                likedBy: req.user._id
            }
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                "video": video
            },
            "Video liked successfully"
        )
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400, "CommentId does not provided")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400,"Comment does not exist")
    }

    const like = await Like.findOne(
        {
            video: commentId,
            likedBy: req.user._id
        },
        {
            new:true
        }
    )

    if(like){
        await Like.findByIdAndDelete(like._id);
    }else{
        const newLike = await Like.create(
            {
                comment : commentId,
                likedBy : req.user._id
            }
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                "Comment": comment
            },
            "Comment successfully liked"
        )
    )


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400,"Please provide tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400,"Tweet does not exist")
    }

    const like = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: req.user._id
        },
        {
            new: true
        }
    )

    if(like){
        await Like.findByIdAndDelete(like._id)
    }else{
        const newLike = Like.create(
            {
                tweet:tweetId,
                likedBy: req.user._id
            },
            {
                new: true
            }
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                "Tweet": tweet
            },
            "Tweet liked successfully"
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likes = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "video",
                    foreignField : "_id",
                    as : "video",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "uploader",
                                foreignField : "_id",
                                as : "uploader"
                            }
                        },
                        {
                            $addFields : {
                                uploader : {
                                    $first : "$uploader"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    video : {
                        $first : "$video"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totalVideo : {
                        $size : "$video"
                    }
                }
            },
            {
                $project : {
                    video : {
                        title : 1,
                        description : 1,
                        videoFile : 1,
                        thumbnail : 1,
                        duration : 1,
                        views : 1,
                        isPublised : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        uploader : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalVideo : 1
                }
            }

        ]
    )

    if(likes.length === 0){
        throw new ApiError(400, "Likes not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likes,
                "Likes found successfully"
            )
        )
})

const getLikedComments = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;


    const comment = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "comments",
                    localField : "comment",
                    foreignField : "_id",
                    as : "commentDetails",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "uploader",
                                foreignField : "_id",
                                as : "uploader"
                            }
                        },
                        {
                            $addFields : {
                                uploader : {
                                    $first : "$uploader"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    comment : {
                        $first : "$commentDetails"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totalComment : {
                        $size : "$commentDetails"
                    }
                }
            },
            {
                $project : {
                    comment : {
                        content : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        video : 1,
                        uploader : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalComment : 1
                }
            }

        ]
    )

    if(comment.length === 0){
        throw new ApiError(400, "Likes not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Likes found successfully"
            )
        )

    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets,
    getLikedComments,
}