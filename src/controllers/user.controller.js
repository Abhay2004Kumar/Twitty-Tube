import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import {uploadCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import {v2} from 'cloudinary'

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
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized Request!")
}

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired!")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} =await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken)
        .json(
            new ApiResponse(
                200,
                {accessToken,newRefreshToken},
                "Access Token refreshed successfully"
            )
        )
    
    } catch (error) {
        throw new ApiError(401, error?.message || 
            "Invalid Refresh Token")
    }

})

const changeCurrentPass = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))

})



const getCurrentUser = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json(200,req.user,"Current user fetched successfully")
})

const updateAccount = asyncHandler(async (req,res) => {
    const {fullname,email} = req.body
    if (!fullname || !email) {
        throw new ApiError(400,"All fields are required!")
    }
    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {
            //Mongo DB operators
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
        
        ).select("-password")
        
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully!"))
    })
    
    const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
        try {
          const result = await v2.uploader.destroy(publicId, { resource_type: resourceType });
          console.log('Delete result:', result);
          return result;
        } catch (error) {
          console.error('Error deleting from Cloudinary:', error);
          throw error;
        }
      };
      
      
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path;
    console.log(req.file);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

   
const us = await User.findById(req.user._id);

// Access the avatar property from the user document
const prevAvatar = us?.avatar;
console.log(prevAvatar);
const arr = prevAvatar.split('/');  
console.log(arr[arr.length-1]);
const newarr = arr[arr.length-1].split('.');
console.log(newarr);

    await deleteFromCloudinary(newarr[0]);

    const avatar = await uploadCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImg = asyncHandler(async (req,res) => {
    const coverImgLocalPath =  req.file?.path

    if (!coverImgLocalPath ) {
        throw new ApiError(400,"Cover image file is missing!")
    }

    const coverImage = await uploadCloudinary(coverImgLocalPath)
    if(!coverImage){
        throw new ApiError(400,"Error while uploading the cover image!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user, "Cover image updated successfully!")
    )
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPass,
    getCurrentUser,
    updateAccount,
    updateUserAvatar,
    updateUserCoverImg

}