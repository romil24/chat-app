import mongoose from "mongoose";
import { DB_NAME } from "../constants";
import logger from "../logger/winston.logger";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    logger.info(`☘️  MongoDB Connected`);
  } catch (error) {
    logger.error("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
