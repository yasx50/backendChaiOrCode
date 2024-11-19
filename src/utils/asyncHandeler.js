const asyncHandeler = (requesthandelr)=>{
    (req,res,next)=>{
        Promise.resolve(requesthandelr(req,res,next)).catch(
            (err)=>next(err)
        )
    }
}