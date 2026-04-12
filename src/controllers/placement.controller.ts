import type { Request, Response } from "express";
import db from "../client.js";

export const getPlacementStatistics = async (req: Request, res: Response) => {
  try {
    const totalStudents = await db.studentProfile.count();

    const placedStudents = await db.application.findMany({
      where: { status: "SELECTED" },
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const placedCount = placedStudents.length;

    const students = await db.studentProfile.findMany({
      include: {
        education: true,
        applications: true,
      },
    });

    const deptMap: Record<string, { total: number; placed: number }> = {};

    students.forEach((student) => {
      const branch = student.education?.branch || "Unknown";

      if (!deptMap[branch]) {
        deptMap[branch] = { total: 0, placed: 0 };
      }

      deptMap[branch].total += 1;

      const isPlaced = student.applications.some(
        (app) => app.status === "SELECTED",
      );

      if (isPlaced) {
        deptMap[branch].placed += 1;
      }
    });
    const departments = Object.entries(deptMap).map(([name, data]) => ({
      name,
      total: data.total,
      placed: data.placed,
      percentage:
        data.total > 0 ? ((data.placed / data.total) * 100).toFixed(2) : 0,
    }));
    const placementRate =
      totalStudents > 0 ? ((placedCount / totalStudents) * 100).toFixed(2) : 0;

    const totalPostings = await db.jobPost.count();

    res.status(200).json({
      totalStudents,
      totalPostings,
      placedCount,
      placementRate,
      departments,
    });
  } catch (error) {
    console.error("Error fetching placement statistics:", error);
    res.status(500).json({
      message: "Failed to fetch placement statistics",
    });
  }
};
