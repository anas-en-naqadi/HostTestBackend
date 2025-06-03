import request from "supertest";
import express from "express";
import quizAttemptRoutes from "../src/routes/quiz_attempts.routes";
import authRoutes from "../src/routes/auth.routes";
import prisma from "../src/config/prisma";

const app = express();
app.use(express.json());
app.use("/api/quiz-attempts", quizAttemptRoutes);
app.use("/auth", authRoutes);

describe("Quiz Attempts API with REAL DB & Token", () => {
  let adminToken: string;
  let userId: number = 7;   // Ensure this matches the test user
  let quizId: number = 15;  // Ensure this quiz exists
  let attemptId: number;

  beforeAll(async () => {
    // Login to get token
    const loginRes = await request(app).post("/auth/login").send({
      email: "ezzahriraja@gmail.com",
      password: "Password123!",
    });
    adminToken = loginRes.body.token;
    console.log("✅ Authenticated, token:", adminToken);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a quiz attempt", async () => {
    const res = await request(app)
      .post("/api/quiz-attempts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user_id: userId,
        quiz_id: quizId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    attemptId = res.body.data.id;
    console.log("✅ Created Quiz Attempt ID:", attemptId);
  });

  it("should update the quiz attempt", async () => {
    const updateData = {
      score: 85,
      passed: true,
      completedAt: new Date().toISOString(),
    };

    const res = await request(app)
      .put(`/api/quiz-attempts/${attemptId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(85);
    expect(res.body.data.passed).toBe(true);
    console.log("✅ Updated Attempt:", res.body.data);
  });

  it("should fetch all quiz attempts for the user", async () => {
    const res = await request(app)
      .get(`/api/quiz-attempts?userId=${userId}&quizId=${quizId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log("✅ All Quiz Attempts:", res.body.data);
  });

  it("should fetch the quiz attempt by ID", async () => {
    const res = await request(app)
      .get(`/api/quiz-attempts/${attemptId}?userId=${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(attemptId);
    console.log("✅ Fetched Attempt by ID:", res.body.data);
  });

  it("should delete the quiz attempt", async () => {
    const res = await request(app)
      .delete(`/api/quiz-attempts/${attemptId}?userId=${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    console.log("✅ Deleted Attempt ID:", attemptId);
  });
});
