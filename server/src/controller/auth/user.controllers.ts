import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../../models/auth/user.models";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getLocalPath,
  getStaticFilePath,
  removeLocalFile,
} from "../../utils/helpers";
import { UserLoginType, UserRolesEnum } from "../../constants";
import { Request, Response } from "express";
import { DecodedToken } from "../../types/index";
import { CustomError, UserDocument } from "../../types/chatApp.types";
// import {
//   emailVerificationMailgenContent,
//   forgotPasswordMailgenContent,
//   sendEmail,
// } from "../../../utils/mail.js";

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user: UserDocument | null = await User.findById(userId);
    if (!user) {
      throw new ApiError(500, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access token"
    );
  }
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, role } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists", []);
  }
  const user: any = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
    role: role || UserRolesEnum.USER,
  });

  /**
   * unHashedToken: unHashed token is something we will send to the user's mail
   * hashedToken: keep record of hashedToken to validate the unHashedToken in verify email controller
   * tokenExpiry: Expiry to be checked before validating the incoming token
   */
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "Users registered successfully and verification email has been sent on your email."
      )
    );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user: UserDocument | null = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.loginType !== UserLoginType.EMAIL_PASSWORD) {
    throw new ApiError(
      400,
      "You have previously registered using " +
        (user.loginType?.toLowerCase() || "unknown") +
        ". Please use the " +
        (user.loginType?.toLowerCase() || "unknown") +
        " login option to access your account."
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return;
  }
  const user = req.user as UserDocument | undefined;
  if (!user) {
    throw new ApiError(404, "User not found ", []);
  }
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  // Turn the email verified flag to `true`
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
});

// This controller is called when user is logged in and he has snackbar that your email is not verified
// In case he did not get the email or the email verification token is expired
// he will be able to resend the token while he is logged in
const resendEmailVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const reqUser = req.user as UserDocument;

    if (!reqUser) {
      throw new ApiError(404, "User not found ", []);
    }

    const user: UserDocument | null = await User.findById(reqUser?._id);

    if (!user) {
      throw new ApiError(404, "User does not exists", []);
    }

    if (user.isEmailVerified) {
      throw new ApiError(409, "Email is already verified!");
    }

    const { hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    // await sendEmail({
    //   email: user?.email,
    //   subject: "Please verify your email",
    //   mailgenContent: emailVerificationMailgenContent(
    //     user.username,
    //     `${req.protocol}://${req.get(
    //       "host"
    //     )}/api/v1/users/verify-email/${unHashedToken}`
    //   ),
    // });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Mail has been sent to your mail ID"));
  }
);

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || ""
    ) as DecodedToken;

    const user = (await User.findById(decodedToken._id)) as any | null;
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // This shows that the refresh token is used or not
    // Once it is used, we are replacing it with new refresh token below
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    const err = error as CustomError;
    throw new ApiError(401, err.message || "Invalid refresh token");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Get email from the client and check if user exists
  const user: any = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exists", []);
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken(); //

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  // Send mail with the password reset link. It should be the link of the frontend url with token
  //   await sendEmail({
  //     email: user?.email,
  //     subject: "Password reset request",
  //     mailgenContent: forgotPasswordMailgenContent(
  //       user.username,
  //       // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
  //       // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
  //       `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
  //     ),
  //   });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset mail has been sent on your mail id"
      )
    );
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  // Create a hash of the incoming reset token

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // See if user with hash similar to resetToken exists
  // If yes then check if token expiry is greater than current date

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  // If either of the one is false that means the token is invalid or expired
  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  // if everything is ok and token id valid
  // reset the forgot password token and expiry
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  // Set the provided password as the new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;

  const user: any = await User.findById(req.user?._id);

  // check the old password
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  // assign new password in plain text
  // We have a pre save method attached to user schema which automatically hashes the password whenever added/modified
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const assignRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  user.role = role;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Role changed for the user"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const handleSocialLogin = asyncHandler(async (req: any, res) => {
  const user: any = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(301)
    .cookie("accessToken", accessToken, options) // set the access token in the cookie
    .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
    .redirect(
      // redirect user to the frontend with access and refresh token in case user is not using cookies
      `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
});

const updateUserAvatar = asyncHandler(async (req: any, res) => {
  // Check if user has uploaded an avatar
  if (!req.file?.filename) {
    throw new ApiError(400, "Avatar image is required");
  }

  // get avatar file system url and local path
  const avatarUrl = getStaticFilePath(req, req.file?.filename);
  const avatarLocalPath = getLocalPath(req.file?.filename);

  const user: any = await User.findById(req.user._id);

  let updatedUser = await User.findByIdAndUpdate(
    req.user._id,

    {
      $set: {
        // set the newly uploaded avatar
        avatar: {
          url: avatarUrl,
          localPath: avatarLocalPath,
        },
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  // remove the old avatar
  removeLocalFile(user.avatar.localPath);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

export {
  assignRole,
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  handleSocialLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  updateUserAvatar,
  verifyEmail,
};
