import type { Request, Response } from "express";
import db from "../../client.js";
import { JobStatus } from "@prisma/client";

export const getStudentNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const jobs = await db.jobPost.findMany({
      where: {
        status: {
          in: [JobStatus.OPEN],
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        company: true,
        role: true,
        createdAt: true,
        deadline: true,
      },
    });

    return res.status(200).json({ jobs });
  } catch (error: any) {
  console.error("Notification Error:", error);
  return res.status(500).json({ error: error.message });
}
};