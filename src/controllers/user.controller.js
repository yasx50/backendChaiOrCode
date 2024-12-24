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

const changeCurrentPassword = asyncHandeler(async(req,res)=>{
    const {oldPassword,newPassword,confPassword} = req.body;
    if (newPassword==confPassword) {
        throw new apiError(400,"new password and confirm password should be same!")
    }

    const user =await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new apiError(400,"invalid password <old>")
    }
     user.password = newPassword;
     await user.save({
        validateBeforeSave:false
     })

     return res.status(200).
     json(
        new apiResponse(200,{},"password changed successfully"

        )
     )

})

const updateAccountDetails = asyncHandeler(async (req,res)=>{
    const {fullname,email} = req.body;
    if (!(fullname||email)) {
      
        throw new apiError(400,"all fields are equired ! ")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
                
            }
        },
        {new:true}
    ).select("-passwordd")
    return res.status(200).json(new apiResponse(200,user,"account updated successfully"))
})

const getCurrentUser = asyncHandeler(async (req,res)=>{
    return res.status(200).
    json(
        200,req.user,"current user fetched successfully"
    )
})  

const updateUserAvatar = asyncHandeler(async (req,res)=>{
   const avtarLocalPath =  req.file?.path
   if(!avtarLocalPath){
    throw new apiError(400,"avtar file is missing");
    
   }
   const avtar =  await uploadOnCloudinary(avtarLocalPath)
   if (!avtar.url) {
    throw new apiError(400,"error while uploading on avtar")
   }

   const user =await  User.findByIdAndUpdate(req.user?._id,
    {
    $set:{
        avtar:avtar.url
    }
   },
   {
    new:true
   }
    ).select("-password")

    return res.status(200).{
        new apiResponse(200,user,"avtar updated successfully!")
    }
})
const updateUserCoverImage = asyncHandeler(async (req,res)=>{
   const coverLocalPath =  req.file?.path
   if(!coverLocalPath){
    throw new apiError(400,"avtar file is missing");
    
   }
   const coverImage =  await uploadOnCloudinary(coverLocalPath)
   if (!coverImage.url) {
    throw new apiError(400,"error while uploading on coverImage")
   }

   const user =await  User.findByIdAndUpdate(req.user?._id,
    {
    $set:{
        coverImage:coverImage.url
    }
   },
   {
    new:true
   }
    ).select("-password")

    return res.status(200).json(
        new apiResponse(200,user,"coverImage updated successfully!")
)
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
    
}