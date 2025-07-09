import { application, json } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  //Access Token - Short lived, not stored in db
  // Refresh Token - Long lived, stored in db
  // When access token expires, the frontend sends the refresh token to the backend to validate user (login), once again.
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // db me bhi to save karo but skip validation (do not run Mongoose schema validators like required, unique, etc.) before saving

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend (user.model) dekho konsi feilds aani hai
  // validation of fields - notEmpty
  // check if usr already exists : username , email
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { username, email, fullName, password } = req.body; //get field values

  if (
    [username, email, fullName, password].some(
      (
        feild // validation
      ) => feild?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are necessary");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // is email/username ka pehla user retrun karega DB se
  }); // checking for unique user

  if (existedUser) {
    throw new ApiError(409, "user already exist with same username or email");
  }
  //req.files will look like:
  /*{
    avatar: [
      {
        fieldname: 'avatar',
        originalname: 'profile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: './public/temp',
        filename: 'profile.jpg',
        path: 'public/temp/profile.jpg',
        size: 12345
      }
    ],
    coverImage: [
      {
        fieldname: 'coverImage',
        originalname: 'cover.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: './public/temp',
        filename: 'cover.jpg',
        path: 'public/temp/cover.jpg',
        size: 23456
      }
    ]
  }*/

  // ?. prevents runtime errors when accessing properties that might not exist.
  const avatarLocalPath = req.files?.avatar[0]?.path; // abhi server pe hi hai
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;               // abhi server pe hi hai

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required"); // checking avatar as a req field
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath); // returned is response
  //console.log(avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create(
    // db user stored
    {
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    }
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // jo jo nahi chaiye - lagake model me ka field ka name likhdo

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  //returnig a Apiresponse

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> ham data lenge
  // login by username or email
  // find the user in db by(username or email) if not found then incorrect
  // if found then check password match
  // generate access and refresh token
  // send tokens by seucre cookies
  //  res -> succesful login

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required for login");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], // is email or username ka pehla user retrun karega DB se
  });

  if (!user) {
    throw new ApiError(404, "user does not exists");
  }

  const isPasswordValid = await user.isCorrectPassword(password); // matching password === this.password usring bycrypt

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials"); // wrong password
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // expensive op but  ensures security, up-to-date data,
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // This works (on a query):  await User.findById(user._id).select("-password -refreshToken"); This does NOT work (on a document):user.select("-password -refreshToken"); // ❌ Not a function on documents

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // for user._id we will make a middleware
  // clear cookies (tokens)
  // reset refresh token in db also

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        // set -> mongoDB ka operator
        refreshToken: undefined, // $set: { field: undefined }	MongoDB ignores the update $set: { field: "" }	Field exists with an empty string value
      },
    },
    {
      new: true, // it ensures you get the updated document from the database after the update operation.
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // goal : when access token expired then provide new if we have refreshToken(sessionToken) valid
  // steps ->
  // get incomming refreshToken and check it
  // compare it with db refreshToken if not eqaul then relogin
  // if equal provide new accessToken and new refreshTokn also for security

  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorised request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    // doubt -> why we are genearting both we should new generate access token only user will be logged in forever
    //  yes user will be loggeed in forever but it provides security to token theft and for erloginn we can set a hard limit session of 30 days to fire relogin
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access tkoen refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // user is already logged in  ->  verifyjwt
  const { oldPassword, newPassword } = req.body;

  const user = User.findById(req.user._id);

  const isPasswordCorrect = user.isCorrectPassword(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Incorrect old password entered");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false }); // pre "save" called and saved bcrypted message

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // user is already logged in  ->  verifyjwt
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler (async (req,res)=>{
   // file update eg profile pic to uska ulagse controller likhna  (pura user wapis se upadate karne ki jarurat nahi)
  const {fullName , email} = req.body

  if(!fullName && !email){
      throw new ApiError(400,"All fields are required")
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        fullName,       //es6 syntax
        email :email,    // normal syntax  both works same
      }
    },
    {
      new :true   // update hone ke baad ki info return hoti hai
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"));

})

const updateUserAvatar = asyncHandler(async (req,res)=>{
  // multer and verifyJWT
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
      throw new ApiError("400","Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
      throw new ApiError(500 ,"Error while uploading avatar on cloudinary");
    }

    const user  = User.findByIdAndUpdate(
          req.user._id,
          {
            $set :{
              avatar : avatar.url
            }
          },
          {
            new :true
          }
    ).select("-password")

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar Image update successfully"));

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // multer and verifyJWT
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError("400", "CoverImage file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "Error while uploading CoverImage on cloudinary");
  }

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"cover Image update successfully")
  )

});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};
