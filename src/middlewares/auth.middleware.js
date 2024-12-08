import {asyncHandeler} from '../utils/asyncHandeler.js'
import {apiError} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new apiError(401,"Unauthorized request")
        }
        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decoded?._id).select("-password -refershToken")
    
        if (!user) {
            throw new apiError(401,"invalid access token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401,error?.message || "invalid access token")
    }
})