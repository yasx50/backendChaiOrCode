const asyncHandeler = (requesthandelr)=>{
    return (req,res,next)=>{
        Promise.resolve(requesthandelr(req,res,next)).catch(
            (err)=>next(err)
        )
    }
}
export {asyncHandeler}