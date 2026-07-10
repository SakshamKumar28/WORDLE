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

}, {timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;
