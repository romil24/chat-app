import dotenv from "dotenv";
import { httpServer } from "./app";
import logger from "./logger/winston.logger";
import connectDB from "./db";

dotenv.config({
  path: "./.env",
});

const startServer = () => {
  httpServer.listen(process.env.PORT || 8080, () => {
    // logger.info(
    //   `📑 Visit the documentation at: http://localhost:${
    //     process.env.PORT || 8080
    //   }`
    // );
    logger.info("⚙️  Server is running on port: " + process.env.PORT);
  });
};

try {
  connectDB();
  startServer();
} catch (err) {
  logger.error("MongoDB connect error: ", err);
}
