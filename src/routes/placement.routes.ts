import express from "express";

const placementRouter = express.Router();
placementRouter.use(express.json());

import { getPlacementStatistics } from "../controllers/placement.controller.js";

placementRouter.get("/statistics", getPlacementStatistics);

export default placementRouter;
