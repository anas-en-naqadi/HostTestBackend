import request from "supertest";
import express from "express";
import authRoutes from "../routes/auth.routes"; // Adjust path as needed

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

describe("Auth API", () => {
  let userToken: string;

  // Test register
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "ezzahrioussama01@gmail.com",
        username: "username",
        full_name: "New User",
        password: "Password123!",
        password_confirmation: "Password123!",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("ezzahrioussama01@gmail.com");
    });
  });

  // Test login
  describe("POST /auth/login", () => {
    it("should login an existing user and return a token", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "ezzahrioussama01@gmail.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      userToken = response.body.token;
      console.log("token returned : ", userToken);
    });

    // it("should fail if email or password is incorrect", async () => {
    //   const response = await request(app).post("/auth/login").send({
    //     email: "wrongemail@gmail.com",
    //     password: "Password123!",
    //   });

    //   expect(response.status).toBe(400);
    //   expect(response.body.error).toBe("User not found");
    // });
  });
});
