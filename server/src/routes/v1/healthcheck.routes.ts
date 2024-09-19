import { Router } from "express";
import { healthCheck } from "../../controller/healthcheck.controllers";

const router = Router();

router.route("/").get(healthCheck);

export default router;
