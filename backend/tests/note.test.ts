import request from "supertest";
import express from "express";
import notesRoutes from "../src/routes/notes.routes";
import authRoutes from "../src/routes/auth.routes";
import prisma from "../src/config/prisma";

const app = express();
app.use(express.json());
app.use("/api", notesRoutes); // Make sure this matches your actual API path
app.use("/auth", authRoutes);

describe("Notes API with REAL DB & Token", () => {
  let authToken: string;
  const userId = 7;
  let lessonId: number;
  let noteId: number;

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

    // Find a lesson the user has access to
    const lesson = await prisma.lessons.findFirst({
      where: {
        modules: {
          courses: {
            enrollments: {
              some: { user_id: userId },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error("No accessible lesson found for test user");
    }
    lessonId = lesson.id;
    console.log("✅ Using Lesson ID:", lessonId);
  });
  afterAll(async () => {
    // Clean up any test notes
    if (noteId) {
      await prisma.notes.deleteMany({ where: { id: noteId } });
    }
    await prisma.$disconnect();
  });

  it("should create a note", async () => {
    const testContent = "Test note content";
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        lessonId: lessonId,
        content: testContent,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      user_id: userId,
      lesson_id: lessonId,
      content: testContent,
    });
    noteId = res.body.data.id;
    console.log("✅ Created Note ID:", noteId);
  });

  it("should get all notes for the user", async () => {
    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log("✅ User Notes Count:", res.body.data.length);
  });

  it("should get a specific note by ID", async () => {
    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(noteId);
    console.log("✅ Fetched Note:", res.body.data);
  });

  it("should update a note", async () => {
    const updatedContent = "Updated note content";
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        content: updatedContent,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe(updatedContent);
    console.log("✅ Updated Note:", res.body.data);
  });

  it("should delete a note", async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    // Verify deletion
    const deletedNote = await prisma.notes.findUnique({
      where: { id: noteId },
    });
    expect(deletedNote).toBeNull();
    console.log("✅ Deleted Note ID:", noteId);
  });

  //   it("should fail when accessing another user's note", async () => {
  //     // Create a test note owned by another user
  //     const otherUserNote = await prisma.notes.create({
  //       data: {
  //         user_id: userId + 1, // Different user
  //         lesson_id: lessonId,
  //         content: "Other user's note"
  //       }
  //     });

  //     try {
  //       const res = await request(app)
  //         .get(`/api/notes/${otherUserNote.id}`)
  //         .set("Authorization", `Bearer ${authToken}`);

  //       expect(res.status).toBe(403);
  //     } finally {
  //       // Clean up
  //       await prisma.notes.delete({ where: { id: otherUserNote.id } });
  //     }
  //   });
});
