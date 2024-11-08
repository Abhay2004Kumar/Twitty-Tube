import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import {uploadCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //save refresh token in MongoDB for future login
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresha and access token")
    }
}


const registerUser = asyncHandler( async (req,res) => {
   //get user details from frontend
    const {fullname, email, username, password}= req.body
   //validation
   if(
    [fullname, email, username, password].some((field) => field?.trim() === "")
   ){
    throw new ApiError(400, "All fields are required")
   }


   //check if user already exists: username, email
   const existedUser = await User.findOne({
    $or: [{username},{email}]
   })

   if(existedUser){
    throw new ApiError(409,"User already exists.")
   }


   console.log(req.files);
   //check for images and check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
coverImageLocalPath=req.files?.coverImage[0]?.path
    } 

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    // upload them on cloudinary, avatar
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }


    // create user object -  create entry in DB
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check for user creation

    if(!createdUser){
        throw new ApiError(500, "Something went wrong during registering the user")
    }

    
    //return response
return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
)


})

const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    //username or email
    const {email,username,password} = req.body 
    if(!(username || email)){
        throw new ApiError(400, "Username or email is required")
    }

    //find the user
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist!")
    }
    // validate password
    const isPasswordvalid = await user.isPasswordCorrect(password)
    if(!isPasswordvalid) {
        throw new ApiError(401, "Password is incorrect!")
    }

    //access and refresh token
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-refreshToken -password")

    //send cookie
    const options = {
        httpOnly: true,
        secure: true
        
    } //cookies are only modifiable through server

    return res.status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in successfully"
            )
    )


})


const logOutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    //for cookies
    const options = {
    httpOnly: true,
    secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

export {
    registerUser,
    loginUser,
    logOutUser
}