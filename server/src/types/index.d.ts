import { Request } from "express";

declare interface DecodedToken {
  _id: string;
}

declare interface ErrorInResponse {
  message: string | null;
}
