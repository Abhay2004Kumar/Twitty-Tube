import dotenv from "dotenv"

import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";

import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

//professional approach
connectDB()






//basic approack
/*
( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}`)
       app.on("errror",(error) => {
        console.log("ERRROR: ", error);
        throw error
       })
       app.listen(process.env.PORT, () => {
        console.log(`APP is listening on port ${process.env.PORT}`);
       })

    } catch (error) {
        console.log("ERROR: ",error);
        throw error
    }
})()

*/