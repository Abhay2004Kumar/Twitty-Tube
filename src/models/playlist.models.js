import mongoose,{Schema} from "mongoose";

const playlistSchema = new Schema({
name: {
    type: String,
    required: true
},
description: {
    type: String,
    required:true
},
videos: [
{
    type: Schema.Types.ObjectId,
    ref: "Video"
}
],
uploader: {
    type: Schema.Types.ObjectId,
    ref: "User"
}
}, {timestamps: true})

export const Playlist = new mongoose.model("Playlist",playlistSchema)