import mongoose from "mongoose";

export const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            minlength:2,
            maxlength:50
        },
       email: {
            type: String,
            required: true,
            unique: true,
            maxlength: 254,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            trim: true,
            lowercase: true
        },
        passwordHash:{
            type: String,
            required: true,
        },
        role:{
            type:String,
            required:true,
            enum:["ADMIN","USER"],
            default:"USER"
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
}
        }

)

const User = mongoose.model("User", userSchema);

export default User;