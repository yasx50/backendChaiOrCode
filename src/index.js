import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
    console.log('connection successfull');
    app.listen(process.env.PORT,'the app is listning at port',process.env.PORT)
    
})
.catch((err)=>{
    console.log('conection failed !!!',err);
    
})

