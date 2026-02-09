import {
  changePassword,
  createAdmin,
  createPasswordResetSession,
  createUser,
  getUsers,
  loginUser,
  requestPasswordChange,
  resendVerificationEmail,
  veryfayUser,
  logoutUser,
} from "../function/function.js";

import express from "express";
import jwt from "jsonwebtoken";
import { AdminAuth, Auth } from "../middleware/Auth.js";
import {
  addEventAnoussment,
  createEvent,
  Enrollment,
  getEvent,
  getEventAnoussments,
  toggleEventVisibility,
  CreateMail,
  sendEmail,
  chatWithAi,
  deleteEventAnoussment,
  getEventById,
  getEventEnrollments,

  finishEvent,
  deleteEvent,
  updateEvent,
} from "../function/EventFunction.js";
const router = express.Router();

router.get("/check-session", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    return res.status(200).json({
      loggedIn: true,
      user: decoded, // Optional: send user info back
    });
  } catch (err) {
    return res.status(401).json({ loggedIn: false });
  }
});

router.post("/create", createUser);
router.get("/", Auth, getUsers);
router.post("/verification", veryfayUser);
router.post("/login", loginUser);
router.post("/createAdmin", createAdmin);
router.post("/resendCode", resendVerificationEmail);
router.post("/requestPasswordChange", requestPasswordChange);
router.post("/createPasswordResetSession", createPasswordResetSession);
router.post("/changePassword", changePassword);
router.post("/createEvent", AdminAuth, createEvent);
router.get("/getEvent", Auth, getEvent);
router.patch("/visibility/:id", AdminAuth, toggleEventVisibility);
router.post("/AddAnnousement", AdminAuth, addEventAnoussment);
router.get("/getEventAnoussments/:Ename", Auth, getEventAnoussments);
router.delete("/deleteAnnouncement/:id", AdminAuth, deleteEventAnoussment);
router.post("/Enrollment", Auth, Enrollment);
router.post("/CreateMail", AdminAuth, CreateMail);
router.post("/sendEmail", AdminAuth, sendEmail);
router.post("/chatWithAi", Auth, chatWithAi);
router.get("/getEventById/:id", Auth, getEventById);
router.get("/getEventEnrollments/:eventName", Auth, getEventEnrollments);
router.post("/finishEvent", AdminAuth, finishEvent); // Using POST as per previous file, could be PATCH
router.delete("/deleteEvent/:id", AdminAuth, deleteEvent);
router.put("/updateEvent/:id", AdminAuth, updateEvent);
router.post("/logout", logoutUser);


export default router;
