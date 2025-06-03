import request from "supertest";
import express from "express";
import enrollmentsRoutes from "../src/routes/enrollments.routes";
import authRoutes from "../src/routes/auth.routes";

const app = express();
app.use(express.json());
app.use("/api", enrollmentsRoutes);
app.use("/auth", authRoutes);

describe("Enrollments API", () => {
  let testEnrollmentId: number;
  const testCourseId = 2; // Using course ID 2 from your successful example
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
  });

  // Test POST /api/enrollments
  describe("POST /api/enrollments", () => {
    it("should create a new enrollment with valid token", async () => {
      const response = await request(app)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ courseId: testCourseId });

      console.log("[POST] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          id: expect.any(Number),
          user_id: expect.any(Number),
          course_id: testCourseId,
          progress_percent: expect.any(Number)
        })
      });

      testEnrollmentId = response.body.data.id;
      console.log("[POST] Created enrollment ID:", testEnrollmentId);
    });

    // it("should fail with invalid course ID", async () => {
    //   const response = await request(app)
    //     .post("/api/enrollments")
    //     .set("Authorization", `Bearer ${authToken}`)
    //     .send({ courseId: "invalid" });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     success: false,
    //     message: "Valid course ID is required",
    //     data: null
    //   });
    // });

    // it("should fail without authentication token", async () => {
    //   const response = await request(app)
    //     .post("/api/enrollments")
    //     .send({ courseId: testCourseId });

    //   expect(response.status).toBe(401);
    // });
  });

  // Test GET /api/enrollments
  describe("GET /api/enrollments", () => {
    it("should get enrollments with valid token", async () => {
      const response = await request(app)
        .get("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`);

      console.log("[GET ALL] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            user_id: expect.any(Number),
            course_id: expect.any(Number)
          })
        ])
      });
    });
  });

  // Test GET /api/enrollments/:id
  describe("GET /api/enrollments/:id", () => {
    it("should get specific enrollment with valid token", async () => {
      const response = await request(app)
        .get(`/api/enrollments/${testEnrollmentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      console.log("[GET ONE] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          id: testEnrollmentId,
          user_id: expect.any(Number),
          course_id: testCourseId
        })
      });
    });

    // it("should fail with invalid enrollment ID", async () => {
    //   const response = await request(app)
    //     .get("/api/enrollments/invalid")
    //     .set("Authorization", `Bearer ${authToken}`);

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     success: false,
    //     message: "Invalid enrollment ID",
    //     data: null
    //   });
    // });
  });

  // Test PUT /api/enrollments/:id
  describe("PUT /api/enrollments/:id", () => {
    it("should update enrollment progress with valid token", async () => {
      const response = await request(app)
        .put(`/api/enrollments/${testEnrollmentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ progressPercent: 50 });

      console.log("[PUT] Response:", JSON.stringify(response.body, null, 2));
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          id: testEnrollmentId,
          progress_percent: 50
        })
      });
    });

    // it("should fail with invalid progress value", async () => {
    //   const response = await request(app)
    //     .put(`/api/enrollments/${testEnrollmentId}`)
    //     .set("Authorization", `Bearer ${authToken}`)
    //     .send({ progressPercent: "invalid" });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     success: false,
    //     message: "Valid progress percent is required",
    //     data: null
    //   });
    // });
  });

  // Test DELETE /api/enrollments/:id
  describe("DELETE /api/enrollments/:id", () => {
    it("should delete enrollment with valid token", async () => {
      const response = await request(app)
        .delete(`/api/enrollments/${testEnrollmentId}`)
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