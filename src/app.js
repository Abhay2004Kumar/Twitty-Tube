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
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes"
import subsriptionRouter from "./routes/subscription.routes"
import tweetRouter from "./routes/tweet.routes"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"

// routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/subscriptions",subsriptionRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/comments",commentRouter)




export { app }