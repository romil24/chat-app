import express from "express";
import authRoute from "./auth/user.routes";
import chatRoute from "./chat/chat.routes";
import messageRoute from "./chat/message.routes";
import { healthCheck } from "../../controller/healthcheck.controllers";
const router = express.Router();
const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/chats",
    route: chatRoute,
  },
  {
    path: "/messages",
    route: messageRoute,
  },
  {
    path: "/healthcheck",
    route: healthCheck,
  },
];

// const devRoutes = [
//   {
//     path: "/docs",
//     route: docsRoute,
//   },
// ];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
// if (config.env === "development") {
//   devRoutes.forEach((route) => {
//     router.use(route.path, route.route);
//   });
// }

export { router };
