import express from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;
//User Controller
import { userRegister } from "../controllers/studentControllers/user.controller.js";
//Profile Controller
import {
  getStudentProfile,
  registerStudentProfile,
  updateStudentProfile,
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
//Social Controller
import {
  addSocialsDetails,
  getSocialsDetails,
  updateSocialsDetails,
  deleteSocialsDetails,
} from "../controllers/studentControllers/social.controller.js";

const studentRouter = express.Router();
studentRouter.use(express.json());

studentRouter.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

//User registration
studentRouter.post("/registerUser", userRegister);

// STUDENT PROFILE REGISTRATION ROUTES
studentRouter.get("/profile", getStudentProfile);
studentRouter.post("/registerStudent", registerStudentProfile);
studentRouter.put("/editProfile", updateStudentProfile);

// Education routes
studentRouter.get("/education", getEducationDetails);
studentRouter.post("/addEducation", addEducationDetails);
studentRouter.put("/editEducation", updateEducationDetails);
studentRouter.delete("/education", deleteEducationDetails);

//ACHIEVEMENT ROUTES
studentRouter.get("/achievement", getAchievementDetails);
studentRouter.post("/addAchievement", addAchievementDetails);
studentRouter.put(
  "/editAchievement/:achievementID",

  updateAchievementDetails
);
studentRouter.delete(
  "/achievement/:achievementID",

  deleteAchievementDetails
);

// //PROJECT ROUTES
studentRouter.get("/project", getProjectDetails);
studentRouter.post("/addProject", addProjectDetails);
studentRouter.put(
  "/editProject/:projectID",

  updateProjectDetails
);
studentRouter.delete(
  "/project/:projectID",

  deleteProjectDetails
);

// //INTERNSHIP ROUTES
studentRouter.get("/internship", getInternshipDetails);
studentRouter.post("/addInternship", addInternshipDetails);
studentRouter.put(
  "/internship/:internshipID",

  updateInternshipDetails
);
studentRouter.delete("/internship/:internshipID", deleteInternshipDetails);

// //Certificate Routes
// studentRouter.get("/profile/certificate", middleware, cont_func);
// studentRouter.post("/profile/certificate", middleware, cont_func);
// studentRouter.put("/profile/certificate/:certificateID", middleware, cont_func);
// studentRouter.delete(
//   "profile/certificate/:certificateID",
//   middleware,
//   cont_func
// );

// //SOCIAL ROUTES
studentRouter.get("/social", getSocialsDetails);
studentRouter.post("/addSocial", addSocialsDetails);
studentRouter.put("/social/:socialsID", updateSocialsDetails);
studentRouter.delete(
  "/social/:socialsID",

  deleteSocialsDetails
);

// //APPLICATION ROUTE
// studentRouter.get("profile/applications", middleware, cont_func);

export default studentRouter;
