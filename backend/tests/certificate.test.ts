import request from "supertest";
import express from "express";
import certificatesRoutes from "../src/routes/certificates.routes";
import authRoutes from "../src/routes/auth.routes";
import prisma from "../src/config/prisma";

const app = express();
app.use(express.json());
app.use("/api", certificatesRoutes); // Base path for certificates routes
app.use("/auth", authRoutes);

describe("Certificates API with REAL DB & Token", () => {
  let authToken: string;
  const userId = 7; // Your test user ID
  let enrollmentId: number; // Will be set dynamically
  let certificateId: number;

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

    // Find an enrollment for the test user
    const enrollment = await prisma.enrollments.findFirst({
      where: { user_id: userId },
      include: { courses: true }
    });

    if (!enrollment) {
      throw new Error("No enrollment found for test user");
    }
    enrollmentId = enrollment.id;
    console.log("✅ Using Enrollment ID:", enrollmentId);
  });

  afterAll(async () => {
    // Clean up any test certificates
    if (certificateId) {
      await prisma.certificates.deleteMany({ where: { id: certificateId } });
    }
    await prisma.$disconnect();
  });

  it("should create a certificate", async () => {
    const res = await request(app)
      .post("/api/certificates")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        enrollmentId: enrollmentId
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      enrollment_id: enrollmentId,
      certificate_url: expect.any(String),
      certificate_code: expect.stringMatching(/^CERT-[A-Z0-9]{8}$/)
    });
    certificateId = res.body.data.id;
    console.log("✅ Created Certificate ID:", certificateId);
  });

  it("should get all certificates for the user", async () => {
    const res = await request(app)
      .get("/api/certificates")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log("✅ User Certificates Count:", res.body.data.length);
  });

  it("should get a specific certificate by ID", async () => {
    const res = await request(app)
      .get(`/api/certificates/${certificateId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(certificateId);
    console.log("✅ Fetched Certificate:", res.body.data);
  });

  it("should update a certificate", async () => {
    const updatedData = {
      certificateUrl: "https://example.com/certificates/UPDATED.pdf",
      certificateCode: "CERT-UPDATED"
    };
    const res = await request(app)
      .put(`/api/certificates/${certificateId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body.data.certificate_url).toBe(updatedData.certificateUrl);
    expect(res.body.data.certificate_code).toBe(updatedData.certificateCode);
    console.log("✅ Updated Certificate:", res.body.data);
  });

  it("should delete a certificate", async () => {
    const res = await request(app)
      .delete(`/api/certificates/${certificateId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    // Verify deletion
    const deletedCertificate = await prisma.certificates.findUnique({
      where: { id: certificateId }
    });
    expect(deletedCertificate).toBeNull();
    console.log("✅ Deleted Certificate ID:", certificateId);
  });

//   it("should fail when accessing another user's certificate", async () => {
//     // Create a test certificate owned by another user
//     const otherUserEnrollment = await prisma.enrollments.findFirst({
//       where: { NOT: { user_id: userId } }
//     });

//     if (!otherUserEnrollment) {
//       console.warn("Skipping test - no other user enrollment found");
//       return;
//     }

//     const otherUserCertificate = await prisma.certificates.create({
//       data: {
//         enrollment_id: otherUserEnrollment.id,
//         certificate_url: "https://example.com/other-cert.pdf",
//         certificate_code: "CERT-OTHER"
//       }
//     });

//     try {
//       const res = await request(app)
//         .get(`/api/certificates/${otherUserCertificate.id}`)
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(403);
//     } finally {
//       // Clean up
//       await prisma.certificates.delete({ where: { id: otherUserCertificate.id } });
//     }
//   });

//   it("should fail to create certificate for invalid enrollment", async () => {
//     const invalidEnrollmentId = 999999; // Non-existent enrollment
//     const res = await request(app)
//       .post("/api/certificates")
//       .set("Authorization", `Bearer ${authToken}`)
//       .send({
//         enrollmentId: invalidEnrollmentId
//       });

//     expect(res.status).toBe(400);
//     expect(res.body.error).toBeDefined();
//   });
});