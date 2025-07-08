//agar appke pas access,refresh token sahi hai(true login)
//tab me req ke andar ek naya object add kardunga req.user

// jab bhi middleware likhte hai tab next() chahiye 
// control pass karne ke liye

// req k pas cookies ja access hai app.use(cookieparser) is vajah se

import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";




export const verifyJWT = asyncHandler (async(req, _ ,next)=>{    //  res use nahi hua to _ in likhte hai production grade code
  // req.cookies?.accessToken is used when the token is stored in cookies (common in web browsers).
  //req.header("Authorization") is used when the token is sent in the HTTP header (common in mobile apps, API clients, or SPAs).
  //Mobile apps and many frontend frameworks (like React Native, Flutter, Postman, etc.) often send the JWT as a Bearer token in the header:
  //Authorization: Bearer <accessToken>


    try {
        const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
        throw new ApiError(401, "Unauthrised request");
        }
    
        // jwt ka use karke secret key se ham decode karenge _id kya hai kyunki hamne token banate vakt di thi
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
        );
    
        if (!user) {
        // discussion about frontend
        throw new ApiError(401, "Invalid Access Token");
        }
    
        req.user = user; // adding .user in req
        next(); //  passes control from the current middleware to the next middleware or route handler in the Express request-response cycle.   It’s essential for chaining multiple middleware functions in Express.
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token"); 
    }
})

