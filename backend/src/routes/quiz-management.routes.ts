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

router.use(authenticate,hasRole(UserRole.INSTRUCTOR));

router.get('/quizzes', listQuizzesController);
router.get('/:id', getQuizByIdController);
router.post('/', createQuizController);
router.put('/:id', updateQuizController);
router.delete('/:id', deleteQuizController);
router.delete('/questions/:questionId', deleteQuestionController);
router.delete('/options/:optionId', deleteOptionController);


export default router;