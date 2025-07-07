import { application, json } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/Apiresponse.js";

const registerUser = asyncHandler(async (req,res)=>{
  // get user details from frontend (user.model) dekho konsi feilds aani hai
  // validation of fields - notEmpty
  // check if usr already exists : username , email
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { username, email, fullName, password } = req.body;      //get field values

  if (
    [username, email, fullName, password].some(
      (
        feild                                                   // validation
      ) => feild?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are necessary");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],                    // is email/username ka pehla user retrun karega DB se
  });                                                  // checking for unique user

  if (existedUser) {
    throw new ApiError(409, "user already exist with same username or email");
  }
  // ?. prevents runtime errors when accessing properties that might not exist.
  const avatarLocalPath = req.files?.avatar[0]?.path;                    // abhi server pe hi hai
  const coverImageLocalPath = req.files?.coverImage[0]?.path;               // abhi server pe hi hai

  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is required")                      // checking avatar as a req field
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);             // returned is response
  console.log(avatar);  
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "avatar file is required");
  }

  const user =await User.create(            // db user stored
    {
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    }
  );

  const createdUser = User.findById(user._id).select
            ("-password -refreshToken");          // jo jo nahi chaiye - lagake model me ka field ka name likhdo

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
  }


  //returnig a Apiresponse

  return res.status(201).json(
      new ApiResponse(200,createdUser,"User registered Successfully")
  )

})


export {registerUser}