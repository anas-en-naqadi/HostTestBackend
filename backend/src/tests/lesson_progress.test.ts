import request from "supertest";
import express from "express";
import lessonProgressRoutes from "../routes/lesson_progress.routes";
import authRoutes from "../routes/auth.routes";

const app = express();
app.use(express.json());
app.use("/api", lessonProgressRoutes);
app.use("/auth", authRoutes);

describe("Lesson Progress API", () => {
  let testLessonId: number;
  let authToken: string;

  // Get auth token before running tests
  beforeAll(async () => {
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: "ezzahriraja@gmail.com",
        password: "Password123!"
      });

    authToken = loginResponse.body.token;
    console.log("[SETUP] Obtained auth token:", authToken);

    // Set a test lesson ID (you should replace this with an actual lesson ID from your database)
    testLessonId = 1;
  });

  // Test POST /api/lesson-progress
  describe("POST /api/lesson-progress", () => {
    it("should create a new lesson progress with valid token", async () => {
      const response = await request(app)
        .post("/api/lesson-progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ lessonId: testLessonId, status: "in_progress" });

      console.log("[POST] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          user_id: expect.any(Number),
          lesson_id: testLessonId,
          status: expect.any(String)
        })
      });
    });

    // it("should fail with invalid lesson ID", async () => {
    //   const response = await request(app)
    //     .post("/api/lesson-progress")
    //     .set("Authorization", `Bearer ${authToken}`)
    //     .send({ lessonId: "invalid" });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     success: false,
    //     message: "Valid lesson ID is required",
    //     data: null
    //   });
    // });

    // it("should fail without authentication token", async () => {
    //   const response = await request(app)
    //     .post("/api/lesson-progress")
    //     .send({ lessonId: testLessonId });

    //   expect(response.status).toBe(401);
    // });
  });

  // Test GET /api/lesson-progress
  describe("GET /api/lesson-progress", () => {
    it("should get all lesson progress with valid token", async () => {
      const response = await request(app)
        .get("/api/lesson-progress")
        .set("Authorization", `Bearer ${authToken}`);

      console.log("[GET ALL] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.arrayContaining([
          expect.objectContaining({
            user_id: expect.any(Number),
            lesson_id: expect.any(Number),
            status: expect.any(String)
          })
        ])
      });
    });
  });

  // Test GET /api/lesson-progress/:lessonId
  describe("GET /api/lesson-progress/:lessonId", () => {
    it("should get specific lesson progress with valid token", async () => {
      const response = await request(app)
        .get(`/api/lesson-progress/${testLessonId}`)
        .set("Authorization", `Bearer ${authToken}`);

      console.log("[GET ONE] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          user_id: expect.any(Number),
          lesson_id: testLessonId
        })
      });
    });

    // it("should fail with invalid lesson ID", async () => {
    //   const response = await request(app)
    //     .get("/api/lesson-progress/invalid")
    //     .set("Authorization", `Bearer ${authToken}`);

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     success: false,
    //     message: "Invalid lesson ID",
    //     data: null
    //   });
    // });
  });

  // Test PUT /api/lesson-progress/:lessonId
  describe("PUT /api/lesson-progress/:lessonId", () => {
    it("should update lesson progress with valid token", async () => {
      const response = await request(app)
        .put(`/api/lesson-progress/${testLessonId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "completed", completedAt: new Date().toISOString() });

      console.log("[PUT] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          user_id: expect.any(Number),
          lesson_id: testLessonId,
          status: "completed"
        })
      });
    });

    // it("should fail with invalid status value", async () => {
    //   const response = await request(app)
    //     .put(`/api/lesson-progress/${testLessonId}`)
    //     .set("Authorization", `Bearer ${authToken}`)
    //     .send({ status: "invalid_status" });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     success: false,
    //     message: "Valid status is required",
    //     data: null
    //   });
    // });
  });

  // Test DELETE /api/lesson-progress/:lessonId
  describe("DELETE /api/lesson-progress/:lessonId", () => {
    it("should delete lesson progress with valid token", async () => {
      const response = await request(app)
        .delete(`/api/lesson-progress/${testLessonId}`)
        .set("Authorization", `Bearer ${authToken}`);

      console.log("[DELETE] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: null
      });
    });
  });
});