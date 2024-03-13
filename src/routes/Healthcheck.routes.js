import { Router } from 'express';
import { healthCheck } from "../controllers/Healthcheck.controller.js"

const router = Router();

router.route("/").get(healthCheck);

export default router