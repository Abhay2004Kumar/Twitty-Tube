import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import  {upload} from "../middlewares/multer.middlewares.js"



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

export default router