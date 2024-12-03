import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
    console.log('connection successfull');
    app.listen(process.env.PORT,()=>{
        console.log('the app is listining at port ',process.env.PORT);
        
    })
    
})
.catch((err)=>{
    console.log('conection failed !!!',err);
    
})

