import { Router, Response, NextFunction } from 'express';
// import { AuthRequest } from 'types/auth';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/auth.types';
import { createQuizController } from '../controllers/quiz-management/create.controller';
import { updateQuizController } from '../controllers/quiz-management/update.controller';
import { deleteQuizController, deleteQuestionController, deleteOptionController } from '../controllers/quiz-management/remove.controller';
import { listQuizzesController } from '../controllers/quiz-management/list.controller';
import { getQuizByIdController } from '../controllers/quiz-management/getById.controller';

const router = Router();

router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));

router.get('/quizzes', hasPermission('quiz:read'), listQuizzesController);
router.get('/:id', hasPermission('quiz:read'), getQuizByIdController);
router.post('/', hasPermission('quiz:create'), createQuizController);
router.put('/:id', hasPermission('quiz:update'), updateQuizController);
router.delete('/:id', hasPermission('quiz:delete'), deleteQuizController);
router.delete('/questions/:questionId', hasPermission('quiz:delete'), deleteQuestionController);
router.delete('/options/:optionId', hasPermission('quiz:delete'), deleteOptionController);


export default router;