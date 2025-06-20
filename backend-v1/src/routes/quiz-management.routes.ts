import { Router, Response, NextFunction } from 'express';
// import { AuthRequest } from 'types/auth';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/auth.types';
import { createQuizController } from '../controllers/quiz-management/create.controller';
import { validateAnswersController } from '../controllers/quiz-management/validateAnswers.controller';
import { updateQuizController } from '../controllers/quiz-management/update.controller';
import { deleteQuizController, deleteQuestionController, deleteOptionController } from '../controllers/quiz-management/remove.controller';
import { listQuizzesController } from '../controllers/quiz-management/list.controller';
import { getQuizByIdController } from '../controllers/quiz-management/getById.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Quiz Management
 *   description: Quiz creation, management and validation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QuizOption:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         text:
 *           type: string
 *         is_correct:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     QuizQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         question_text:
 *           type: string
 *         question_type:
 *           type: string
 *           enum: [multiple_choice, true_false, short_answer]
 *         points:
 *           type: integer
 *         order_index:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizOption'
 * 
 *     Quiz:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         time_limit:
 *           type: integer
 *           description: Time limit in minutes
 *         attempts_allowed:
 *           type: integer
 *         passing_score:
 *           type: number
 *           format: float
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     QuizWithQuestions:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         time_limit:
 *           type: integer
 *         attempts_allowed:
 *           type: integer
 *         passing_score:
 *           type: number
 *           format: float
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizQuestion'
 * 
 *     CreateQuizRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - questions
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         time_limit:
 *           type: integer
 *           description: Time limit in minutes
 *         attempts_allowed:
 *           type: integer
 *           default: 1
 *         passing_score:
 *           type: number
 *           format: float
 *           default: 70.0
 *         is_active:
 *           type: boolean
 *           default: true
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - question_text
 *               - question_type
 *               - points
 *               - options
 *             properties:
 *               question_text:
 *                 type: string
 *               question_type:
 *                 type: string
 *                 enum: [multiple_choice, true_false, short_answer]
 *               points:
 *                 type: integer
 *               order_index:
 *                 type: integer
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - is_correct
 *                   properties:
 *                     text:
 *                       type: string
 *                     is_correct:
 *                       type: boolean
 * 
 *     ValidateAnswersRequest:
 *       type: object
 *       required:
 *         - quizId
 *         - answers
 *       properties:
 *         quizId:
 *           type: integer
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - questionId
 *               - answer
 *             properties:
 *               questionId:
 *                 type: integer
 *               answer:
 *                 type: string
 *               selectedOptionId:
 *                 type: integer
 *                 description: For multiple choice questions
 * 
 *     ValidateAnswersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             score:
 *               type: number
 *               format: float
 *             totalPoints:
 *               type: integer
 *             earnedPoints:
 *               type: integer
 *             passed:
 *               type: boolean
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: integer
 *                   correct:
 *                     type: boolean
 *                   points:
 *                     type: integer
 *                   earnedPoints:
 *                     type: integer
 */

/**
 * @swagger
 * /api/quiz/validate-answers:
 *   post:
 *     summary: Validate quiz answers
 *     description: Submit and validate answers for a quiz
 *     tags: [Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateAnswersRequest'
 *     responses:
 *       200:
 *         description: Answers validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateAnswersResponse'
 *             example:
 *               success: true
 *               results:
 *                 - questionId: 1
 *                   optionId: 3
 *                   isCorrect: true
 *                 - questionId: 2
 *                   optionId: 7
 *                   isCorrect: false
 *               score: 1
 *               total: 2
 *       400:
 *         description: Bad request (invalid quiz ID, missing answers, or invalid answer format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Each answer must have questionId and optionId"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// Quiz answer validation endpoints (for client answer validation)
router.post('/validate-answers',authenticate,hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN,UserRole.INTERN]), validateAnswersController);

router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));

/**
 * @swagger
 * /api/quiz/quizzes:
 *   get:
 *     summary: List all quizzes
 *     description: Retrieve all quizzes created by the authenticated user
 *     tags: [Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quiz'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/quizzes', hasPermission('quiz:read'), listQuizzesController);

/**
 * @swagger
 * /api/quiz/{id}:
 *   get:
 *     summary: Get quiz by ID
 *     description: Retrieve a specific quiz with its questions and options
 *     tags: [Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/QuizWithQuestions'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', hasPermission('quiz:read'), getQuizByIdController);

/**
 * @swagger
 * /api/quiz:
 *   post:
 *     summary: Create a new quiz
 *     description: Create a new quiz with questions and options
 *     tags: [Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuizRequest'
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/QuizWithQuestions'
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', hasPermission('quiz:create'), createQuizController);

/**
 * @swagger
 * /api/quiz/{id}:
 *   put:
 *     summary: Update quiz
 *     description: Update an existing quiz with its questions and options
 *     tags: [Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuizRequest'
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/QuizWithQuestions'
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', hasPermission('quiz:update'), updateQuizController);

/**
 * @swagger
 * /api/quiz/{id}:
 *   delete:
 *     summary: Delete quiz
 *     description: Delete a quiz and all associated questions and options
 *     tags: [Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', hasPermission('quiz:delete'), deleteQuizController);
router.delete('/questions/:questionId', hasPermission('quiz:delete'), deleteQuestionController);
router.delete('/options/:optionId', hasPermission('quiz:delete'), deleteOptionController);

export default router;