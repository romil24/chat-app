import e, { Request, Response } from "express";
import { Document, Error } from "mongoose";

export interface Avatar {
  url: string;
  localPath: string;
}
export interface TemporaryToken {
  unHashedToken: string;
  hashedToken: string;
  tokenExpiry: number;
}

export interface IUser {
  avatar: Avatar;
  username: string;
  email: string;
  role: string;
  password: string;
  loginType: string;
  isEmailVerified: boolean;
  refreshToken?: string;
  forgotPasswordToken?: string;
  forgotPasswordExpiry?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiry?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IDocument extends Document {
  _id: string;
}
export interface UserDocument extends IUser, IDocument {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateTemporaryToken(): TemporaryToken;
}

export interface CustomRequest extends Request {
  user?: UserDocument;
}

export interface CustomError {
  message: string | undefined;
  code?: number | undefined;
}
