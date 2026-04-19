import type { Request, Response } from "express";
import db from "../../client.js";

export const getApplicationsForJob = async (req: Request, res: Response) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    const { jobId } = req.params;

    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!jobId) {
      return res.status(400).json({ error: "Job ID required" });
    }

    const user = await db.user.findUnique({ where: { auth0Id } });

    if (!user || (user.role !== "ADMIN" && user.role !== "TNP_OFFICER")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Fetch job (for eligibility data if needed later)
    const job = await db.jobPost.findUnique({
      where: { id: jobId },
      include: { eligibility: true },
    });

    // Fetch applications
    const applications = await db.application.findMany({
      where: { jobPostId: jobId },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            education: true,
            projects: true,
            internships: true,
            certifications: true,
            achievements: true,
            socials: true,
          },
        },
      },
    });

    // Score Calculation Function
    const calculateScore = (student: any) => {
      const cgpa = student.education?.cgpa || 0;
      const projects = student.projects.length;
      const internships = student.internships.length;
      const certifications = student.certifications.length;

      const cgpaScore = cgpa / 10; // normalize
      const projectScore = Math.min(projects / 5, 1);
      const internshipScore = Math.min(internships / 3, 1);
      const certScore = Math.min(certifications / 3, 1);

      return (
        cgpaScore * 0.5 +
        projectScore * 0.2 +
        internshipScore * 0.2 +
        certScore * 0.1
      );
    };

    // Attach score + rank
    const scoredApplications = applications.map((app) => ({
      ...app,
      score: calculateScore(app.student),
    }));

    //  Sort by score DESC
    scoredApplications.sort((a, b) => b.score - a.score);

    // Add rank
    const rankedApplications = scoredApplications.map((app, index) => ({
      ...app,
      rank: index + 1,
      score: Math.round(app.score * 100), // convert to %
    }));

    res.json({ applications: rankedApplications });
  } catch (err: any) {
    console.error("Admin applications fetch failed:", err);
    res.status(500).json({ error: err.message });
  }
};
