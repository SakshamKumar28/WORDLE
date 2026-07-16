import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    secretWord: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active"
    }
}, { timestamps: true });

const Room = mongoose.model("Room", roomSchema);

export default Room;
