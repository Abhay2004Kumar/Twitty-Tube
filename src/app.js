import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"  //used for applying CRUD operation on cookies

const app=express()

//config cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16Kb"})) //used for extended objects
app.use(express.static("public")) //store assets

app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"

// routes declaration
app.use("/api/v1/users",userRouter)



export { app }