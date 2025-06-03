import request from "supertest";
import express from "express";
import userAnswersRoutes from "../src/routes/user_answers.routes";
import authRoutes from "../src/routes/auth.routes";
import prisma from "../src/config/prisma";

const app = express();
app.use(express.json());
app.use("/api", userAnswersRoutes); // Base path for user answers routes
app.use("/auth", authRoutes);

describe("User Answers API with REAL DB & Token", () => {
  let authToken: string;
  const userId = 7; // Your test user ID
  let attemptId: number;
  let questionId: number;
  let optionId: number;
  let existingAnswer: boolean = false;

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

    // Find an attempt belonging to the user
    const attempt = await prisma.quiz_attempts.findFirst({
      where: {
        user_id: userId
      },
      include: {
        quizzes: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    if (!attempt) {
      throw new Error("No quiz attempts found for testing");
    }

    attemptId = attempt.id;
    
    // Get a question from this quiz
    const question = attempt.quizzes.questions[0];
    if (!question) {
      throw new Error("No questions found in the quiz for testing");
    }
    
    questionId = question.id;
    
    // Get an option for this question
    const option = question.options[0];
    if (!option) {
      throw new Error("No options found for the question for testing");
    }
    
    optionId = option.id;

    // Check if an answer already exists
    const existingAnswerRecord = await prisma.user_answers.findUnique({
      where: {
        attempt_id_question_id: { attempt_id: attemptId, question_id: questionId }
      }
    });
    
    existingAnswer = !!existingAnswerRecord;
    console.log(`✅ Using Attempt ID: ${attemptId}, Question ID: ${questionId}, Option ID: ${optionId}`);
    console.log(`ℹ️ Answer already exists: ${existingAnswer}`);
  });

  afterAll(async () => {
    // Clean up any test answer entries
    await prisma.user_answers.deleteMany({ 
      where: { 
        attempt_id: attemptId,
        question_id: questionId
      } 
    });
    await prisma.$disconnect();
  });

  it("should create a user answer", async () => {
    // Skip if answer already exists
    if (existingAnswer) {
      console.log("ℹ️ Skipping create test - answer already exists");
      return;
    }

    const res = await request(app)
      .post("/api/user-answers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ attemptId, questionId, optionId });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      attempt_id: attemptId,
      question_id: questionId,
      option_id: optionId
    });
    console.log("✅ Created User Answer for question:", questionId);
  });

  it("should get all user answers for the user", async () => {
    const res = await request(app)
      .get("/api/user-answers")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log("✅ User Answers Count:", res.body.data.length);
  });

  it("should get a specific user answer by attempt ID and question ID", async () => {
    // Ensure answer exists
    if (!existingAnswer) {
      await prisma.user_answers.upsert({
        where: { 
          attempt_id_question_id: { attempt_id: attemptId, question_id: questionId }
        },
        create: {
          attempt_id: attemptId,
          question_id: questionId,
          option_id: optionId,
          answered_at: new Date()
        },
        update: {}
      });
    }

    const res = await request(app)
      .get(`/api/user-answers/${attemptId}/${questionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.attempt_id).toBe(attemptId);
    expect(res.body.data.question_id).toBe(questionId);
    console.log("✅ Fetched User Answer:", res.body.data);
  });

  it("should update a user answer", async () => {
    // Ensure answer exists
    if (!existingAnswer) {
      await prisma.user_answers.upsert({
        where: { 
          attempt_id_question_id: { attempt_id: attemptId, question_id: questionId }
        },
        create: {
          attempt_id: attemptId,
          question_id: questionId,
          option_id: optionId,
          answered_at: new Date()
        },
        update: {}
      });
    }

    // Find a different option for this question
    const differentOption = await prisma.options.findFirst({
      where: {
        question_id: questionId,
        id: { not: optionId }
      }
    });

    const newOptionId = differentOption ? differentOption.id : optionId;

    const res = await request(app)
      .put(`/api/user-answers/${attemptId}/${questionId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ optionId: newOptionId });

    expect(res.status).toBe(200);
    expect(res.body.data.attempt_id).toBe(attemptId);
    expect(res.body.data.question_id).toBe(questionId);
    expect(res.body.data.option_id).toBe(newOptionId);
    expect(res.body.data.answered_at).toBeDefined();
    console.log("✅ Updated User Answer:", res.body.data);
  });

  it("should delete a user answer", async () => {
    // Ensure answer exists
    if (!existingAnswer) {
      await prisma.user_answers.upsert({
        where: { 
          attempt_id_question_id: { attempt_id: attemptId, question_id: questionId }
        },
        create: {
          attempt_id: attemptId,
          question_id: questionId,
          option_id: optionId,
          answered_at: new Date()
        },
        update: {}
      });
    }

    const res = await request(app)
      .delete(`/api/user-answers/${attemptId}/${questionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    // Verify deletion
    const deletedAnswer = await prisma.user_answers.findUnique({
      where: { 
        attempt_id_question_id: { attempt_id: attemptId, question_id: questionId }
      }
    });
    expect(deletedAnswer).toBeNull();
    console.log("✅ Deleted User Answer for question:", questionId);
  });
});