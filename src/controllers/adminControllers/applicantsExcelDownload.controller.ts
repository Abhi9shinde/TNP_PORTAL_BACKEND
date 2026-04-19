import type { Request, Response } from "express";
import db from "../../client.js";
import * as XLSX from "xlsx";

export const exportApplicationsCSV = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;
    console.log("Requested fields:", req.query);
    console.log(req.query.fields);
    const fields =
      (req.query.fields as string)?.split(",").map((f) => f.trim()) || [];

    console.log(fields);
    if (!jobId) {
      return res.status(400).json({ error: "Job ID required" });
    }

    const job = await db.jobPost.findUnique({
      where: { id: jobId },
      select: { role: true, company: true },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const applications = await db.application.findMany({
      where: {
        jobPostId: jobId,
        ...(status && status !== "ALL" && { status: status as any }),
      },
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
      orderBy: { appliedAt: "desc" },
    });

    const rows = applications.map((app, index) => {
      const student = app.student;
      const row: any = {
        "Sr No": index + 1,
        Name: `${student.firstName} ${student.lastName}`,
        Email: student.user.email,
        "Personal Email": app.student.personalEmail ?? "-",
        DOB: app.student.dob?.toISOString().substring(0, 10) ?? "-",
        Branch: app.student.education?.branch ?? "-",
        "Agg. CGPA": app.student.education?.cgpa ?? "-",
        Backlogs: app.student.education?.backlogs ?? "-",
        "10th Percent": app.student.education?.tenthPercent ?? "-",
        "12th Percent": app.student.education?.twelfthPercent ?? "-",
        "Diploma Percent": app.student.education?.diplomaPercent ?? "-",
        Skills: app.student.skills?.join(", ") ?? "-",
      };
      if (fields.includes("projects")) {
        row["Projects"] = student.projects.map((p) => p.title).join(" | ");
      }
      if (fields.includes("internships")) {
        row["Internships"] = student.internships
          .map((i) => `${i.company} (${i.role})`)
          .join(" | ");
      }

      if (fields.includes("achievements")) {
        row["Achievements"] = student.achievements
          .map((a) => a.title)
          .join(" | ");
      }

      if (fields.includes("certifications")) {
        row["Certifications"] = student.certifications
          .map((c) => c.title)
          .join(" | ");
      }
      row["AppliedAt"] = app.appliedAt.toISOString();

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    // Auto column width
    const columnWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...rows.map((row) => String(row[key as keyof typeof row]).length),
        ) + 2,
    }));
    worksheet["!cols"] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const fileName =
      `${job.company}-${job.role}-${status || "all"}-applications.xlsx`
        .replace(/\s+/g, "-")
        .toLowerCase();

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.status(200).send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
