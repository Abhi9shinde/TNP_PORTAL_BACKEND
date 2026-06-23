import type { Request, Response } from "express";
import db from "../client.js";

export const getAllPostingDetails = async (req: Request, res: Response) => {
  try {
    const postings = await db.jobPost.findMany({
      where: {
        status: {
          in: ["OPEN", "CLOSED"],
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ postings });
  } catch (error: any) {
    console.error("Error getting postings:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
};
