import {asyncHandeler} from '../utils/asyncHandeler.js'
import {apiError} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


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


export {registerUser}