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

const toPercent = (num: number, den: number) =>
  den > 0 ? Number(((num / den) * 100).toFixed(2)) : 0;

const parseCtcToLpa = (ctc: string | null) => {
  if (!ctc) return null;

  const match = ctc.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  if (!match) return null;

  const value = Number(match[1]);
  if (Number.isNaN(value)) return null;

  const normalized = ctc.toLowerCase();
  if (normalized.includes("lpa") || normalized.includes("lac")) {
    return value;
  }

  if (
    normalized.includes("pa") ||
    normalized.includes("annum") ||
    normalized.includes("year")
  ) {
    return Number((value / 100000).toFixed(2));
  }

  return value;
};

const buildMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const buildLastMonths = (count: number) => {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = buildMonthKey(d);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    months.push({ key, label });
  }

  return months;
};

export const getDetailedPlacementStatistics = async (
  req: Request,
  res: Response,
) => {
  try {
    const [students, applications, jobPosts] = await Promise.all([
      db.studentProfile.findMany({
        select: {
          id: true,
          education: {
            select: {
              branch: true,
              cgpa: true,
            },
          },
        },
      }),
      db.application.findMany({
        select: {
          id: true,
          studentId: true,
          status: true,
          appliedAt: true,
          student: {
            select: {
              education: {
                select: {
                  branch: true,
                },
              },
            },
          },
          jobPost: {
            select: {
              company: true,
              ctc: true,
            },
          },
        },
      }),
      db.jobPost.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const totalStudents = students.length;
    const placedStudentIds = new Set<string>();
    const selectedApplications = applications.filter(
      (application) => application.status === "SELECTED",
    );

    selectedApplications.forEach((application) => {
      placedStudentIds.add(application.studentId);
    });

    const placedStudents = placedStudentIds.size;
    const unplacedStudents = Math.max(totalStudents - placedStudents, 0);
    const placementRate = toPercent(placedStudents, totalStudents);

    const departmentMap = new Map<
      string,
      {
        totalStudents: number;
        placedStudentIds: Set<string>;
        selectedOffers: number;
        ctcValues: number[];
      }
    >();

    students.forEach((student) => {
      const department = student.education?.branch ?? "Unknown";
      if (!departmentMap.has(department)) {
        departmentMap.set(department, {
          totalStudents: 0,
          placedStudentIds: new Set<string>(),
          selectedOffers: 0,
          ctcValues: [],
        });
      }

      const dept = departmentMap.get(department);
      if (dept) dept.totalStudents += 1;
    });

    selectedApplications.forEach((application) => {
      const department = application.student.education?.branch ?? "Unknown";
      if (!departmentMap.has(department)) {
        departmentMap.set(department, {
          totalStudents: 0,
          placedStudentIds: new Set<string>(),
          selectedOffers: 0,
          ctcValues: [],
        });
      }

      const dept = departmentMap.get(department);
      if (!dept) return;

      dept.placedStudentIds.add(application.studentId);
      dept.selectedOffers += 1;

      const ctcLpa = parseCtcToLpa(application.jobPost.ctc);
      if (ctcLpa !== null) {
        dept.ctcValues.push(ctcLpa);
      }
    });

    const departmentWise = Array.from(departmentMap.entries())
      .map(([department, stats]) => {
        const placedCount = stats.placedStudentIds.size;
        const averageCtcLpa =
          stats.ctcValues.length > 0
            ? Number(
                (
                  stats.ctcValues.reduce((sum, value) => sum + value, 0) /
                  stats.ctcValues.length
                ).toFixed(2),
              )
            : null;

        const highestCtcLpa =
          stats.ctcValues.length > 0 ? Math.max(...stats.ctcValues) : null;

        return {
          department,
          totalStudents: stats.totalStudents,
          placedStudents: placedCount,
          unplacedStudents: Math.max(stats.totalStudents - placedCount, 0),
          selectedOffers: stats.selectedOffers,
          placementRate: toPercent(placedCount, stats.totalStudents),
          averageCtcLpa,
          highestCtcLpa,
        };
      })
      .sort((a, b) => b.placedStudents - a.placedStudents);

    const monthTemplate = buildLastMonths(12);
    const monthlyMap = new Map<
      string,
      {
        selectedOffers: number;
        students: Set<string>;
      }
    >();

    selectedApplications.forEach((application) => {
      const monthKey = buildMonthKey(application.appliedAt);
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { selectedOffers: 0, students: new Set<string>() });
      }

      const monthStats = monthlyMap.get(monthKey);
      if (!monthStats) return;

      monthStats.selectedOffers += 1;
      monthStats.students.add(application.studentId);
    });

    const cumulativeStudents = new Set<string>();
    const monthlyPlacementTrend = monthTemplate.map(({ key, label }) => {
      const monthStats = monthlyMap.get(key);
      if (monthStats) {
        monthStats.students.forEach((studentId) => cumulativeStudents.add(studentId));
      }

      return {
        month: label,
        selectedOffers: monthStats?.selectedOffers ?? 0,
        uniquePlacedStudents: monthStats?.students.size ?? 0,
        cumulativePlacedStudents: cumulativeStudents.size,
      };
    });

    const applicationStatusBreakdown = {
      PENDING: 0,
      SHORTLISTED: 0,
      SELECTED: 0,
      REJECTED: 0,
    };

    applications.forEach((application) => {
      applicationStatusBreakdown[application.status] += 1;
    });

    const companyMap = new Map<
      string,
      {
        selectedOffers: number;
        selectedStudentIds: Set<string>;
        ctcValues: number[];
      }
    >();

    selectedApplications.forEach((application) => {
      const company = application.jobPost.company || "Unknown";
      if (!companyMap.has(company)) {
        companyMap.set(company, {
          selectedOffers: 0,
          selectedStudentIds: new Set<string>(),
          ctcValues: [],
        });
      }

      const companyStats = companyMap.get(company);
      if (!companyStats) return;

      companyStats.selectedOffers += 1;
      companyStats.selectedStudentIds.add(application.studentId);

      const ctcLpa = parseCtcToLpa(application.jobPost.ctc);
      if (ctcLpa !== null) companyStats.ctcValues.push(ctcLpa);
    });

    const companyWiseSelections = Array.from(companyMap.entries())
      .map(([company, stats]) => ({
        company,
        selectedOffers: stats.selectedOffers,
        uniquePlacedStudents: stats.selectedStudentIds.size,
        averageCtcLpa:
          stats.ctcValues.length > 0
            ? Number(
                (
                  stats.ctcValues.reduce((sum, value) => sum + value, 0) /
                  stats.ctcValues.length
                ).toFixed(2),
              )
            : null,
      }))
      .sort((a, b) => b.selectedOffers - a.selectedOffers)
      .slice(0, 10);

    const postingStatusBreakdown = {
      DRAFT: 0,
      OPEN: 0,
      CLOSED: 0,
      ARCHIVED: 0,
    };

    jobPosts.forEach((post) => {
      postingStatusBreakdown[post.status] += 1;
    });

    const postingMonths = buildLastMonths(6);
    const postingTrendCounter = new Map<string, number>();
    jobPosts.forEach((post) => {
      const monthKey = buildMonthKey(post.createdAt);
      postingTrendCounter.set(monthKey, (postingTrendCounter.get(monthKey) ?? 0) + 1);
    });

    const monthlyJobPostingTrend = postingMonths.map(({ key, label }) => ({
      month: label,
      postings: postingTrendCounter.get(key) ?? 0,
    }));

    const cgpaBuckets: Record<
      "below6" | "between6And7" | "between7And8" | "between8And9" | "above9" | "noData",
      { total: number; placed: number }
    > = {
      below6: { total: 0, placed: 0 },
      between6And7: { total: 0, placed: 0 },
      between7And8: { total: 0, placed: 0 },
      between8And9: { total: 0, placed: 0 },
      above9: { total: 0, placed: 0 },
      noData: { total: 0, placed: 0 },
    };

    students.forEach((student) => {
      const cgpa = student.education?.cgpa;
      let key: keyof typeof cgpaBuckets = "noData";

      if (typeof cgpa === "number") {
        if (cgpa < 6) key = "below6";
        else if (cgpa < 7) key = "between6And7";
        else if (cgpa < 8) key = "between7And8";
        else if (cgpa < 9) key = "between8And9";
        else key = "above9";
      }

      cgpaBuckets[key].total += 1;
      if (placedStudentIds.has(student.id)) {
        cgpaBuckets[key].placed += 1;
      }
    });

    const cgpaPlacementInsights = Object.entries(cgpaBuckets).map(([bucket, data]) => ({
      bucket,
      totalStudents: data.total,
      placedStudents: data.placed,
      placementRate: toPercent(data.placed, data.total),
    }));

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      overview: {
        totalStudents,
        placedStudents,
        unplacedStudents,
        placementRate,
        totalApplications: applications.length,
        selectedOffers: selectedApplications.length,
        selectionRate: toPercent(selectedApplications.length, applications.length),
      },
      departmentWise,
      monthlyPlacementTrend,
      companyWiseSelections,
      applicationStatusBreakdown,
      postingInsights: {
        totalPostings: jobPosts.length,
        postingStatusBreakdown,
        monthlyJobPostingTrend,
      },
      cgpaPlacementInsights,
    });
  } catch (error) {
    console.error("Error fetching detailed placement statistics:", error);
    res.status(500).json({
      message: "Failed to fetch detailed placement statistics",
    });
  }
};
