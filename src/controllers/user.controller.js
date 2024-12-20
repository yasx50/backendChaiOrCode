import {asyncHandeler} from '../utils/asyncHandeler.js'
import {apiError} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from 'jsonwebtoken'

const genrateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.genrateAccessToken()
        const refreshToken = await user.genrateRefreshToken()
        user.refershToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}


    } catch (error) {
        console.log('this is error',error.message);
        
        throw new apiError(500,"SOmething went wrong while genratining access and refresh token")
    }

}
const registerUser = asyncHandeler(async (req,res)=>{
    const {fullname,email,username,password} = req.body
    

    if (
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ) {
        throw new apiError(400,"All fields are required !")
        
    }

    const existedUser =await User.findOne({
        $or:[{ username },{ email }]
    })
    
    if (existedUser) {
        throw new apiError(409,"User with email or username already exists "); 
    }
    // console.log('the file body',req.files);
    
    const avtarLocalPath = req.files?.avtar[0]?.path;
    // const coverimageLocalPath = req.files?.coverImage[0]?.path;
    let coverimageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0) {
        coverimageLocalPath = req.files.coverImage[0].path
    }

    if (!avtarLocalPath) {
        throw new apiError(400,"Avtar file is required !")
    }
    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverimageLocalPath)
    
    if (!avtar) {
        throw new apiError(400,"Avtar file is required !")    
    }

    const user = await User.create({
        fullname,
        avtar:avtar.url,
        coverImage:coverImage?.url||"",
        password,
        username,
        email
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refershToken"
    )

    if(!createdUser) {
        throw new apiError(500,"something went wrong while registering the user !")
    }
    return res.status(201).json(
        new apiResponse(200,createdUser,"user created successfully !")
    )
})
const loginUser = asyncHandeler(async (req,res)=>{
    const { email,username,password} = req.body;
    console.log('req body',req.body);
    
    if(!(username || email)){
        throw new apiError(400,"username or email is required !!")
 
    }

   const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user) throw new apiError(404,"user not found !!")

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new apiError(401,"Invalid user credentials !!!")
        
    }

    console.log('the user id',user._id);
    const { accessToken,refershToken} = await genrateAccessAndRefreshToken(user._id)
    

    const loggedInUser = await User.findById(user._id).select("-password -refershToken")

    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refershToken,options).
    json(
        new apiResponse(
            200,
            {
                user:loggedInUser,accessToken,refershToken
            },
            "user logged in successfully"

        )
       
    )
    



})

const logoutUser = asyncHandeler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refershToken: undefined

            }
        },
        {
            new :true
        }
        
    )
    
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refershToken",options)
    .json(new apiResponse(200,{},"user logged out"))
})

const refreshAcccessToken = asyncHandeler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refershToken || req.body.refershToken
   if (!incomingRefreshToken) {
    throw new apiError(401,"unauthorized request !")
   }
   try {
    const decoded = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decoded?._id)
 
    if (!user) {
     throw new apiError(401,"Invalid refresh token")
    }
 
    if (incomingRefreshToken != user?.refershToken) {
     throw new apiError(401,"refresh token is expired or used")
    }
 
    const options = {
     httpOnly:true,
     secure:true
    }
 
    const {accessToken,NewrefreshToken } = await genrateAccessAndRefreshToken(user._id)
 
    return res.status(200)
    .cookie("refershToken",NewrefreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
     new apiResponse(200,{refershToken:NewrefreshToken,accessToken},
         "Access token refreshed !"
     )
    )
   } catch (error) {
    
    
    throw new apiError(500,error.message,"something went wrong while refreshing the access token !")
    
   }

})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAcccessToken
    
}