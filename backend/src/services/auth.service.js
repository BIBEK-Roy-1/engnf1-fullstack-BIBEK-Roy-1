import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function registerUser({name,email,password}){
        // 1. Validate input types
    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        const error = new Error("Invalid registration data");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    // 2. Normalize input
    name = name.trim();
    email = email.trim().toLowerCase();

    // 3. Validate name
    if (name.length < 2 || name.length > 50) {
        const error = new Error("Name must be 2-50 characters");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }


    if(email.length>254 || !emailRegex.test(email)){
        const error = new Error("Invalid email address");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }

      // 5. Validate password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

        if (!passwordRegex.test(password)) {
        const error = new Error(
            "Password must be 8-64 characters and contain a letter and a digit"
        );
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    // 6. Check whether email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        error.code = "CONFLICT";
        throw error;
    }

    // 7. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({
            name,
            email,
            passwordHash,
            role: "USER"
        });
        // 9. Return safe user data
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };
    }catch (error) {
        // Handle duplicate email if two registrations happen simultaneously
        if (error.code === 11000) {
            const conflictError = new Error("Email already registered");
            conflictError.statusCode = 409;
            conflictError.code = "CONFLICT";
            throw conflictError;
        }

        throw error;
    }
}

export async function loginUser({email,password}){
  

    if (
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        const error = new Error("Invalid Login data");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }
      email=email.trim().toLowerCase();

     if(email.length>254 || !emailRegex.test(email)){
        const error = new Error("Invalid email address");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    const foundUser = await User.findOne({ email });
    if(!foundUser){
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "UNAUTHENTICATED";
    throw error;
    }

    const isPasswordValid = await bcrypt.compare(password,foundUser.passwordHash);

    if(!isPasswordValid){
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "UNAUTHENTICATED";
    throw error;
    }

    const token=jwt.sign(
        {userId: foundUser._id,
            email:foundUser.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn:process.env.JWT_EXPIRE_IN
        }
    )
    return {
        token:token,
        user:{
        id:foundUser._id,
        name:foundUser.name,
        email:foundUser.email,
        role:foundUser.role,
        createdAt:foundUser.createdAt,
        }
        
    }

}
