import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName :{
        type: String,
        required: true,
        trim : true,
    },
    lastName : {
        type: String,
        trim : true,
    },
    email :{
        type : String,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email'] ,
        required: true,
        lowercase : true,
        unique: true
    },
    password : {
        type: String,
        required: true,
        minLength : [6, "Password should have length atleast 6"]
    },
    refreshToken: {
        type: String,
        default: null,
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        winStreak: { type: Number, default: 0 },
        rank: { type: String, default: "Bronze V" }
    },
    dailyChallenges: {
        lastReset: { type: Date, default: Date.now },
        fastWins: { type: Number, default: 0 },     // e.g. Solve words in less than 4 tries
        speedDuelsWon: { type: Number, default: 0 } // e.g. Win 5 speed-duels in active matchmaking
    }
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;
