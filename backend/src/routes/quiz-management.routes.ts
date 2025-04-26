import { Router, Response, NextFunction } from 'express';
// import { AuthRequest } from 'types/auth';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/auth.types';
import { createQuizController } from '../controllers/quiz-management/create.controller';
import { updateQuizController } from '../controllers/quiz-management/update.controller';
import { deleteQuizController, deleteQuestionController, deleteOptionController } from '../controllers/quiz-management/remove.controller';
import { listQuizzesController } from '../controllers/quiz-management/list.controller';
import { getQuizByIdController } from '../controllers/quiz-management/getById.controller';

const router = Router();

// List and get quizzes: Any authenticated user
router.get('/quizzes', authenticate, listQuizzesController);
router.get('/quizzes/:id', authenticate, getQuizByIdController);

// Create, update, delete quizzes: Admins and instructors only
router.post('/quizzes', authenticate, hasRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), createQuizController);
router.put('/quizzes/:id', authenticate, hasRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), updateQuizController);
router.delete('/quizzes/:id', authenticate, hasRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), deleteQuizController);
router.delete('/questions/:questionId', authenticate, hasRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), deleteQuestionController);
router.delete('/options/:optionId', authenticate, hasRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), deleteOptionController);


export default router;