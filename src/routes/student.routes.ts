import express from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;

//Profile Controller
import {
  getStudentProfile,
  registerStudentProfile,
  updateStudentProfile,
  getFullStudentProfile,
} from "../controllers/studentControllers/profile.controller.js";
//Education Controller
import {
  addEducationDetails,
  getEducationDetails,
  updateEducationDetails,
  deleteEducationDetails,
} from "../controllers/studentControllers/education.controller.js";
//Achievement Controller
import {
  addAchievementDetails,
  getAchievementDetails,
  updateAchievementDetails,
  deleteAchievementDetails,
} from "../controllers/studentControllers/achievement.controller.js";
//Project Controller
import {
  addProjectDetails,
  getProjectDetails,
  updateProjectDetails,
  deleteProjectDetails,
} from "../controllers/studentControllers/project.controller.js";
//Internship Controller
import {
  addInternshipDetails,
  getInternshipDetails,
  updateInternshipDetails,
  deleteInternshipDetails,
} from "../controllers/studentControllers/internship.controller.js";
//Certificate Controller
import {
  addCertificateDetails,
  getCertificateDetails,
  updateCertficateDetails,
  deleteCertificateDetails,
} from "../controllers/studentControllers/certificate.controller.js";
//Social Controller
import {
  addSocialsDetails,
  getSocialsDetails,
  updateSocialsDetails,
  deleteSocialsDetails,
} from "../controllers/studentControllers/social.controller.js";
//Application Controller
import {
  applyForJob,
  getApplications,
} from "../controllers/studentControllers/application.controller.js";
//Resume Controller
import { downloadResume } from "../controllers/studentControllers/resume.controller.js";
//Eligibility Controller
import { getEligibilityCriteria } from "../controllers/studentControllers/eligibility.controller.js";
import {
  getPublicProfile,
  searchStudents,
} from "../controllers/studentControllers/publicprofile.controller.js";
//Interview Experience Controller
import {
  createInterviewExperience,
  getInterviewExperiences,
  getInterviewExperienceById,
  updateInterviewExperience,
  deleteInterviewExperience,
} from "../controllers/studentControllers/interviewExperience.controller.js";

import { getStudentNotifications } from "../controllers/studentControllers/notification.controller.js";

const studentRouter = express.Router();
studentRouter.use(express.json());

studentRouter.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// STUDENT PROFILE REGISTRATION ROUTES
studentRouter.get("/profile", getStudentProfile);
studentRouter.post("/registerStudent", registerStudentProfile);
studentRouter.put("/editProfile", updateStudentProfile);
// Get full student profile with all details
studentRouter.get("/profile/full", getFullStudentProfile);

// Education routes
studentRouter.get("/education", getEducationDetails);
studentRouter.post("/addEducation", addEducationDetails);
studentRouter.put("/editEducation", updateEducationDetails);
studentRouter.delete("/education", deleteEducationDetails);

//ACHIEVEMENT ROUTES
studentRouter.get("/achievement", getAchievementDetails);
studentRouter.post("/addAchievement", addAchievementDetails);
studentRouter.put("/editAchievement/:achievementID", updateAchievementDetails);
studentRouter.delete("/achievement/:achievementID", deleteAchievementDetails);

// //PROJECT ROUTES
studentRouter.get("/project", getProjectDetails);
studentRouter.post("/addProject", addProjectDetails);
studentRouter.put("/editProject/:projectID", updateProjectDetails);
studentRouter.delete("/project/:projectID", deleteProjectDetails);

// //INTERNSHIP ROUTES
studentRouter.get("/internship", getInternshipDetails);
studentRouter.post("/addInternship", addInternshipDetails);
studentRouter.put("/internship/:internshipID", updateInternshipDetails);
studentRouter.delete("/internship/:internshipID", deleteInternshipDetails);

//Certificate Routes
studentRouter.get("/certificate", getCertificateDetails);
studentRouter.post("/addCertificate", addCertificateDetails);
studentRouter.put("/certificate/:certificateID", updateCertficateDetails);
studentRouter.delete("/certificate/:certificateID", deleteCertificateDetails);

// //SOCIAL ROUTES
studentRouter.get("/social", getSocialsDetails);
studentRouter.post("/addSocial", addSocialsDetails);
studentRouter.put("/social/:socialsID", updateSocialsDetails);
studentRouter.delete("/social/:socialsID", deleteSocialsDetails);

// //APPLICATION ROUTE
studentRouter.post("/applyForJob", applyForJob);
studentRouter.get("/applications", getApplications);
// studentRouter.get("profile/applications", middleware, cont_func);

//ELIGIBILITY CRITERIA ROUTE
studentRouter.get("/getEligibilityCriteria/:jobPostId", getEligibilityCriteria);

//RESUME DOWNLOAD ROUTE
studentRouter.get("/download-resume", downloadResume);

//Profile Routes
studentRouter.get("/search", searchStudents);
studentRouter.get("/publicProfile/:userId", getPublicProfile);

//Interview Experience Routes
studentRouter.post("/interview-experience", createInterviewExperience);
studentRouter.get("/interview-experiences", getInterviewExperiences);
studentRouter.get("/interview-experience/:id", getInterviewExperienceById);
studentRouter.put("/interview-experience/:id", updateInterviewExperience);
studentRouter.delete("/interview-experience/:id", deleteInterviewExperience);

studentRouter.get("/notifications", getStudentNotifications);

export default studentRouter;
