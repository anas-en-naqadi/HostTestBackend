import { Response } from "express";
import { AppError } from "../../middleware/error.middleware";
import { updateQuizWithDetails } from "../../services/quiz-management/update.service";
import { AuthRequest } from "../../types/quiz.types";
import { logActivity } from "../../utils/activity_log.utils";

export const updateQuizController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, "User not authenticated");
    }
    
    const quizData = { id: parseInt(req.params.id, 10), ...req.body };
    const quiz = await updateQuizWithDetails(user.id, quizData);

    logActivity(
      user.id,
      "QUIZ_UPDATED",
      `${user.full_name} updated quiz ID ${req.params.id}`,
      req.ip
    ).catch(console.error);

    res
      .status(200)
      .json({
        success: true,
        message: "Quiz Updated successfully",
        data: quiz,
      });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Update quiz error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update quiz" });
    }
  }
};
