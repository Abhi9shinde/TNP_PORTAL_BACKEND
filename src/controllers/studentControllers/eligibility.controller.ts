import type { Request, Response } from "express";
import db from "../../client.js";

export const getEligibilityCriteria = async (req: Request, res: Response) => {
  try {
    const { jobPostId } = req.params;

    if (!jobPostId) {
      return res.status(400).json({ error: "Job Post ID is required" });
    }

    const eligibility = await db.eligibilityCriteria.findUnique({
      where: { jobPostId },
    });

    const auth0Id = req.auth?.payload.sub;

    if (!auth0Id) {
      res.json({
        message: "Invalid User"
      });
      return;
    }
    const user = await db.user.findUnique({
      where: {
        auth0Id
      },
      include: {
        student: {
          include: {
            applications: true
          }
        }
      }
    })

    if (!user) {
      res.json({
        message: "User doesn't exist"
      });
      return;
    }

    // const student = await db.studentProfile.findUnique({
    //   where: {
    //     userId: user.id
    //   },
    //   include: {
    //     applications: true
    //   }
    // })

    // if (!student) {
    //   res.json({
    //     message: "Student doesn't exist"
    //   });
    //   return;
    // }

    // const applications = await db.application.findMany({
    //   where: {
    //     studentId: student.id
    //   }
    // })

    const studentApplications = user.student?.applications;
    const selectedApplication = studentApplications?.filter((applications) => {
      return applications.status == "SELECTED" && applications.jobPostId
    })
    console.log(selectedApplication);

    const offers = selectedApplication?.map((app) => app.jobPostId) ?? [];

    const selectedJobPosts = await db.jobPost.findMany({
      where: {
        id: { in: offers },
      },
    });
    const arrayOfSelectedCtcs = selectedJobPosts
      .map((post) => post.ctc?.toString().trim())
      .filter((ctc): ctc is string => !!ctc);

    console.log("Selected Application CTCs:", arrayOfSelectedCtcs);

    const job = await db.jobPost.findUnique({
      where: {
        id: jobPostId
      }
    })

    const offer = job?.ctc?.toString().trim();
    console.log("Current Job CTC:", offer);

    let samePackageOffered = false;
    if (offer && arrayOfSelectedCtcs.includes(offer)) {
      samePackageOffered = true;
    }
    if (!eligibility) {
      return res
        .status(404)
        .json({ error: "Eligibility criteria not found for this job post" });
    }
    console.log({ eligibility, samePackageOffered })
    return res.status(200).json({ eligibility, samePackageOffered });
  } catch (error) {
    console.error("Error fetching eligibility criteria:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch eligibility criteria" });
  }
};
