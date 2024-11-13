import { Router } from "express";
import { changeCurrentPass, getCurrentUser, getUserChannelProfile, getWatchHistory, logOutUser, loginUser, refreshAccessToken, registerUser, updateAccount, updateUserAvatar, updateUserCoverImg } from "../controllers/user.controller.js";
import  {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";



const router = Router()

router.route("/register").post(
    upload.fields([  // middleware upload is used just brfore the methid registration
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/updateAvatar").post(updateUserAvatar)
//secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPass)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/updateAccount").patch(verifyJWT, updateAccount)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImg)

//for params
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)


export default router