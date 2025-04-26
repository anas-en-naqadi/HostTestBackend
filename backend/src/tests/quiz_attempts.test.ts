import request from "supertest";
import express from "express";
import quizAttemptsRoutes from "../routes/quiz_attempts.routes";
import authRoutes from "../routes/auth.routes";
import prisma from "../config/prisma";
import { quiz_attempts } from "@prisma/client";

interface QuizAttemptResponse {
  id: number;
  user_id: number;
  quiz_id: number;
  started_at: string;
  completed_at?: string;
  score?: number;
  passed?: boolean;
  created_at: string;
  updated_at: string;
}

const app = express();
app.use(express.json());
app.use("/api", quizAttemptsRoutes); // Base path for quiz attempts routes
app.use("/auth", authRoutes);

describe("Quiz Attempts API with REAL DB & Token", () => {
  let authToken: string;
  const userId = 7; // Your test user ID
  let quizId: number; // Will be set dynamically
  let attemptId: number; // Will store created attempt ID

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

    // Find a quiz that the user is enrolled in
    const enrolledCourse = await prisma.enrollments.findFirst({
      where: { user_id: userId },
      include: {
        courses: {
          include: {
            modules: {
              include: {
                lessons: {
                  where: {
                    quiz_id: { not: null }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!enrolledCourse || !enrolledCourse.courses.modules.length) {
      throw new Error("No enrolled courses with quizzes found for testing");
    }

    // Find a quiz from lessons in the enrolled course
    const lesson = enrolledCourse.courses.modules
      .flatMap(module => module.lessons)
      .find(lesson => lesson.quiz_id !== null);
    
    if (!lesson || !lesson.quiz_id) {
      throw new Error("No quizzes found in enrolled courses for testing");
    }

    quizId = lesson.quiz_id;
    console.log("✅ Using Quiz ID:", quizId);
  });

  afterAll(async () => {
    // Clean up test quiz attempts
    if (attemptId) {
      await prisma.quiz_attempts.delete({
        where: { id: attemptId }
      }).catch(() => {
        console.log("Attempt already deleted or doesn't exist");
      });
    }
    await prisma.$disconnect();
  });

  it("should create a quiz attempt", async () => {
    const res = await request(app)
      .post("/api/quiz-attempts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ quizId });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      user_id: userId,
      quiz_id: quizId,
      started_at: expect.any(String)
    });
    
    // Store attempt ID for future tests
    attemptId = res.body.data.id;
    console.log("✅ Created Quiz Attempt:", attemptId);
  });

  it("should get all quiz attempts for the user", async () => {
    const res = await request(app)
      .get("/api/quiz-attempts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((attempt: QuizAttemptResponse) => attempt.id === attemptId)).toBe(true);
    console.log("✅ User Quiz Attempts Count:", res.body.data.length);
  });

  it("should get a specific quiz attempt by ID", async () => {
    const res = await request(app)
      .get(`/api/quiz-attempts/${attemptId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(attemptId);
    expect(res.body.data.user_id).toBe(userId);
    expect(res.body.data.quiz_id).toBe(quizId);
    console.log("✅ Fetched Quiz Attempt:", res.body.data);
  });

  it("should update a quiz attempt", async () => {
    const score = 85;
    const passed = true;
    const completedAt = new Date().toISOString();

    const res = await request(app)
      .put(`/api/quiz-attempts/${attemptId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ score, passed, completedAt });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(attemptId);
    expect(res.body.data.user_id).toBe(userId);
    expect(res.body.data.quiz_id).toBe(quizId);
    expect(res.body.data.score).toBe(score);
    expect(res.body.data.passed).toBe(passed);
    expect(res.body.data.completed_at).toBeDefined();
    console.log("✅ Updated Quiz Attempt:", res.body.data);
  });

  it("should get quiz attempts filtered by quiz ID", async () => {
    const res = await request(app)
      .get(`/api/quiz-attempts?quizId=${quizId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((attempt: QuizAttemptResponse) => attempt.quiz_id === quizId)).toBe(true);
    expect(res.body.data.some((attempt: QuizAttemptResponse) => attempt.id === attemptId)).toBe(true);
    console.log("✅ Filtered Quiz Attempts Count:", res.body.data.length);
  });

  it("should delete a quiz attempt", async () => {
    const res = await request(app)
      .delete(`/api/quiz-attempts/${attemptId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    // Verify deletion
    const deletedAttempt = await prisma.quiz_attempts.findUnique({
      where: { id: attemptId }
    });
    expect(deletedAttempt).toBeNull();
    console.log("✅ Deleted Quiz Attempt:", attemptId);
  });

  it("should fail when creating a quiz attempt for non-existent quiz", async () => {
    // Find a non-existent quiz ID
    const maxQuizId = await prisma.quizzes.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const nonExistentQuizId = maxQuizId ? maxQuizId.id + 1000 : 9999;

    const res = await request(app)
      .post("/api/quiz-attempts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ quizId: nonExistentQuizId });

    expect(res.status).toBe(500);
    expect(res.body.message).toBeDefined();
    console.log("✅ Failed to create attempt for non-existent quiz");
  });

  it("should fail when getting a non-existent quiz attempt", async () => {
    const nonExistentId = 999999;
    
    const res = await request(app)
      .get(`/api/quiz-attempts/${nonExistentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBeDefined();
    console.log("✅ Failed to get non-existent quiz attempt");
  });

  it("should fail when updating a non-existent quiz attempt", async () => {
    const nonExistentId = 999999;
    
    const res = await request(app)
      .put(`/api/quiz-attempts/${nonExistentId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ score: 100, passed: true });

    expect(res.status).toBe(500);
    expect(res.body.message).toBeDefined();
    console.log("✅ Failed to update non-existent quiz attempt");
  });

  it("should fail when deleting a non-existent quiz attempt", async () => {
    const nonExistentId = 999999;
    
    const res = await request(app)
      .delete(`/api/quiz-attempts/${nonExistentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBeDefined();
    console.log("✅ Failed to delete non-existent quiz attempt");
  });

  it("should fail when accessing quiz attempts without authentication", async () => {
    const res = await request(app).get("/api/quiz-attempts");
    expect(res.status).toBe(401);
    console.log("✅ Rejected unauthenticated request");
  });
});