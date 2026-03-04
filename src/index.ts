import express from "express";
import type { Request, Response, NextFunction } from "express";
import "dotenv/config";
import db from "./client.js";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";
import studentRouter from "./routes/student.routes.js";
import adminRouter from "./routes/admin.routes.js";
import userRouter from "./routes/user.routes.js";
import postingRouter from "./routes/posting.routes.js";
import { requireRole } from "./middleware/roleGuard.js";

const app = express();

// ---------------- CORS (Using the package!) ----------------
const allowedOrigins = [
  "https://tnp-frontend-gold.vercel.app",
  "https://tnpportalbackend-production.up.railway.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    optionsSuccessStatus: 204, // For legacy browsers
  }),
);

// ---------------- Middleware ----------------
app.use(express.json());
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE!,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN!}/`,
});

// ---------------- Routes ----------------
app.use("/api/v1/user", userRouter);
app.use("/api/v1/student", checkJwt, requireRole(["STUDENT"]), studentRouter);
app.use(
  "/api/v1/admin",
  checkJwt,
  requireRole(["ADMIN", "TNP_OFFICER"]),
  adminRouter,
);
app.use("/api/v1/postings", checkJwt, postingRouter);

app.get("/secure-route", checkJwt, (req, res) => {
  res.json({ message: "You are authenticated!", user: req.auth?.payload.sub });
});

// Root
app.get("/", (req, res) => {
  // return res.redirect("https://tnp-frontend-gold.vercel.app/success");
  res.json({ message: "API is running", authenticated: false });
});

// Profile route
app.get("/profile", checkJwt, async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub!;

    const dbUser = await db.user.findUnique({
      where: { auth0Id },
    });

    if (!dbUser) {
      return res.status(404).json({ message: "User not found in DB" });
    }

    res.json(dbUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// // Check auth status (useful for frontend)
// app.get("/api/auth/status", (req, res) => {
//   res.json({
//     isAuthenticated: req.oidc?.isAuthenticated() || false,
//     user: req.oidc?.user || null,
//   });
// });

// // Access Denied
// app.get("/access-denied", (req, res) => {
//   res.send("Access Denied");
// });

// ---------------- Error Handler ----------------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
