import {asyncHandeler} from '../utils/asyncHandeler.js'


const registerUser = asyncHandeler(async (re,res)=>{
    res.status(200).json({
        message:"chai or code"
    })
})


export {registerUser}