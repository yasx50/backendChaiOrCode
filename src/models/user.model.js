import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'


const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avtar:{
        type:String, //cloudnary url ho ga yaha pr
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }
                ],
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refershToken:{
        type:String
    }

},{
    timestamps:true
})


userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();
    this.password =await bcrypt.hash(this.password,10)
    next()
    
})

// isme ham khud k methods bhi laga skte hai

userSchema.methods.idPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.genrateAccessToken  = function (){
    return jwt.sign(
        { //paylod
            _id:this._id,
            username:this.username,
            fullname:this.fullname,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.genrateRefreshToken  = function (){
    return jwt.sign(
        { //paylod
            _id:this._id
            
        }, //secret
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User',userSchema)