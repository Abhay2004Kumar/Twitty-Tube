import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {upload} from "../middlewares/multer.middlewares.js"
import {deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo, updateVideoThumbnail} from "../controllers/video.controller.js"

const router = Router()

router.route("/upload-video").post(
    verifyJWT,
    upload.fields(
        [
            {
                name:"videoFile"
            },
            {
                name:"thumbnail"
            }
        ]
    ), 
    publishAVideo
)

router.route("/get-video/:videoId").get(verifyJWT,getVideoById)

router.route("/get-all-videos").get(getAllVideos)

router.route("/update-videoDetails/:videoId").patch(verifyJWT,updateVideo);

router.route("/update-video-thumbnail/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideoThumbnail
)

router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo)

router.route("/toggle-published-status/:videoId").get(verifyJWT,togglePublishStatus);




export default router