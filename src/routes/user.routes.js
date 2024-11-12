import { Router } from "express";
import { logOutUser, loginUser, refreshAccessToken, registerUser, updateUserAvatar } from "../controllers/user.controller.js";
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


router.put('/updateAvatar', upload.single('file'), updateUserAvatar);
//secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)


export default router