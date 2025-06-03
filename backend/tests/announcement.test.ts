import request from "supertest";
import express from "express";
import announcementsRoutes from "../src/routes/announcements.routes";
import authRoutes from "../src/routes/auth.routes";
import prisma from "../src/config/prisma";

const app = express();
app.use(express.json());
app.use("/api", announcementsRoutes); // Base path for announcements routes
app.use("/auth", authRoutes);

describe("Announcements API with REAL DB & Token", () => {
  let authToken: string;
  const userId = 7; // Your test user ID
  let courseId: number; // Will be set dynamically
  let announcementId: number;

  beforeAll(async () => {
    // Login to get token
    const loginRes = await request(app).post("/auth/login").send({
      email: "ezzahriraja@gmail.com",
      password: "Password123!",
    });

    // Add error handling for login
    if (loginRes.status !== 200) {
      console.error("Login failed:", loginRes.body);
      throw new Error("Authentication failed");
    }

    authToken = loginRes.body.token;
    console.log("✅ Authenticated, token:", authToken);

    // Find a course where the user is either enrolled or an instructor
    const course = await prisma.courses.findFirst({
      where: {
        OR: [
          { enrollments: { some: { user_id: userId } } },
          { instructors: { user_id: userId } },
        ],
      },
    });

    if (!course) {
      throw new Error("No accessible course found for test user");
    }
    courseId = course.id;
    console.log("✅ Using Course ID:", courseId);
  });

  afterAll(async () => {
    // Clean up any test announcements
    if (announcementId) {
      await prisma.announcements.deleteMany({ where: { id: announcementId } });
    }
    await prisma.$disconnect();
  });

  it("should create an announcement (if user is instructor)", async () => {
    // First check if user is instructor for this course
    const isInstructor = await prisma.instructors.findFirst({
      where: { user_id: userId, courses: { some: { id: courseId } } },
    });

    if (!isInstructor) {
      console.log(
        "ℹ️ Skipping create test - user is not instructor for this course"
      );
      return;
    }

    const testData = {
      courseId: courseId,
      title: "Test Announcement",
      content: "This is a test announcement content",
    };

    const res = await request(app)
      .post("/api/announcements")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testData);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      course_id: courseId,
      publisher_id: userId,
      title: testData.title,
      content: testData.content,
    });
    announcementId = res.body.data.id;
    console.log("✅ Created Announcement ID:", announcementId);
  });

  it("should get all announcements for the user", async () => {
    const res = await request(app)
      .get("/api/announcements")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log("✅ User Announcements Count:", res.body.data.length);
  });

  it("should get a specific announcement by ID", async () => {
    // If no announcement was created (user not instructor), create one by admin
    if (!announcementId) {
      const adminUser = await prisma.users.findFirst({
        where: {
          roles: {
            name: "admin", // Ensure 'name' is the correct field in the roles model
          },
        },
      });

      if (adminUser) {
        const announcement = await prisma.announcements.create({
          data: {
            course_id: courseId,
            publisher_id: adminUser.id,
            title: "Admin Created Announcement",
            content: "Content for admin created announcement",
          },
        });
        announcementId = announcement.id;
        console.log(
          "ℹ️ Created announcement by admin for testing:",
          announcementId
        );
      } else {
        console.log(
          "ℹ️ Skipping test - no admin user found to create test announcement"
        );
        return;
      }
    }

    const res = await request(app)
      .get(`/api/announcements/${announcementId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(announcementId);
    console.log("✅ Fetched Announcement:", res.body.data);
  });

  it("should update an announcement (if user is instructor)", async () => {
    // Check if user is instructor
    const isInstructor = await prisma.instructors.findFirst({
      where: { user_id: userId, courses: { some: { id: courseId } } },
    });

    if (!isInstructor || !announcementId) {
      console.log(
        "ℹ️ Skipping update test - user is not instructor or no announcement exists"
      );
      return;
    }

    const updatedData = {
      title: "Updated Announcement Title",
      content: "Updated announcement content",
    };

    const res = await request(app)
      .put(`/api/announcements/${announcementId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe(updatedData.title);
    expect(res.body.data.content).toBe(updatedData.content);
    console.log("✅ Updated Announcement:", res.body.data);
  });

  it("should delete an announcement (if user is instructor)", async () => {
    // Check if user is instructor
    const isInstructor = await prisma.instructors.findFirst({
      where: { user_id: userId, courses: { some: { id: courseId } } },
    });

    if (!isInstructor || !announcementId) {
      console.log(
        "ℹ️ Skipping delete test - user is not instructor or no announcement exists"
      );
      return;
    }

    const res = await request(app)
      .delete(`/api/announcements/${announcementId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    // Verify deletion
    const deletedAnnouncement = await prisma.announcements.findUnique({
      where: { id: announcementId },
    });
    expect(deletedAnnouncement).toBeNull();
    console.log("✅ Deleted Announcement ID:", announcementId);

    // Reset announcementId since it's now deleted
    announcementId = 0;
  });

  it("should fail when creating announcement for unauthorized course", async () => {
    // Find a course where user is neither enrolled nor instructor
    const unauthorizedCourse = await prisma.courses.findFirst({
      where: {
        NOT: {
          OR: [
            { enrollments: { some: { user_id: userId } } },
            { instructors: { user_id: userId } },
          ],
        },
      },
    });

    if (!unauthorizedCourse) {
      console.log("ℹ️ Skipping test - no unauthorized course found");
      return;
    }

    const testData = {
      courseId: unauthorizedCourse.id,
      title: "Unauthorized Announcement",
      content: "This should fail",
    };

    const res = await request(app)
      .post("/api/announcements")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("should fail when accessing another user's announcement from unrelated course", async () => {
    // Find an announcement from a course the user has no access to
    const unrelatedAnnouncement = await prisma.announcements.findFirst({
      where: {
        courses: {
          NOT: {
            OR: [
              { enrollments: { some: { user_id: userId } } },
              { instructors: { user_id: userId } },
            ],
          },
        },
      },
    });

    if (!unrelatedAnnouncement) {
      console.log("ℹ️ Skipping test - no unrelated announcements found");
      return;
    }

    const res = await request(app)
      .get(`/api/announcements/${unrelatedAnnouncement.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(403);
  });
});
