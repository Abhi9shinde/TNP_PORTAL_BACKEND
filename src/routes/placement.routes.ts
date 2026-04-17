import express from "express";

const placementRouter = express.Router();
placementRouter.use(express.json());

import {
  getDetailedPlacementStatistics,
  getPlacementStatistics,
} from "../controllers/placement.controller.js";

placementRouter.get("/statistics", getPlacementStatistics);
placementRouter.get("/statistics/detailed", getDetailedPlacementStatistics);

export default placementRouter;
