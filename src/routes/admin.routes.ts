import express from "express";
//Posting Controllers
import {
  addPostingDetails,
  updatePostingDetails,
} from "../controllers/adminControllers/posting.controller.js";
//Eligibility Controllers
import {
  addEligibilityCriteria,
  updateEligibilityCriteria,
  getEligibilityCriteria,
} from "../controllers/adminControllers/eligibility.controller.js";
//Combined Controllers
import { createJobWithEligibility } from "../controllers/adminControllers/posting_and_eligi.controller.js";
//Profile Controllers
import {
  getAdminProfile,
  upsertAdminProfile,
} from "../controllers/adminControllers/profile.controller.js";
//Job Status Controllers
import { updateJobStatus } from "../controllers/adminControllers/jobStatus.controller.js";
//Job Controllers
import {
  getAllJobsForAdmin,
  getJobByIdForAdmin,
  notifyEligibleNotApplied,
} from "../controllers/adminControllers/job.controller.js";
//Application Controllers
import { getApplicationsForJob } from "../controllers/adminControllers/application.controller.js";
import { bulkUpdateApplicationStatus } from "../controllers/adminControllers/applicationStatus.controller.js";
//Excel Download Controller
import { exportApplicationsCSV } from "../controllers/adminControllers/applicantsExcelDownload.controller.js";

const adminRouter = express.Router();
adminRouter.use(express.json());

//PROFILE
adminRouter.get("/profile", getAdminProfile);
adminRouter.post("/profile", upsertAdminProfile);
adminRouter.put("/profile", upsertAdminProfile);

//add status (like: active, inactive) to posting
adminRouter.post("/addPostingDetails", addPostingDetails);
adminRouter.put("/editPostingDetails", updatePostingDetails);

adminRouter.post("/addEligibilityCriteria", addEligibilityCriteria);
adminRouter.put("/editEligibilityCriteria", updateEligibilityCriteria);
adminRouter.get("/getEligibilityCriteria/:jobPostId", getEligibilityCriteria);

adminRouter.post("/createJobWithEligibility", createJobWithEligibility);

adminRouter.get("/jobs", getAllJobsForAdmin);
adminRouter.get("/jobs/:jobId", getJobByIdForAdmin);

adminRouter.post("/jobs/:jobId/notify", notifyEligibleNotApplied);

adminRouter.patch("/job/status", updateJobStatus);

adminRouter.get("/jobs/:jobId/applications", getApplicationsForJob);
adminRouter.patch("/applications/status", bulkUpdateApplicationStatus);

adminRouter.get("/jobs/:jobId/applications/download", exportApplicationsCSV);

export default adminRouter;
