// src/routes/certificates.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { listCertificatesController } from '../controllers/certificates/list.controller';
import { createCertificateController } from '../controllers/certificates/create.controller';
import { downloadCertificateController } from '../controllers/certificates/download.controller';
import { UserRole } from '../types/user.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate generation and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Certificate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         enrollmentId:
 *           type: integer
 *         certificateCode:
 *           type: string
 *         certificateUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     CertificateWithDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         certificateCode:
 *           type: string
 *         certificateUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         course:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             thumbnail_url:
 *               type: string
 *         student:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             full_name:
 *               type: string
 *             email:
 *               type: string
 *         completedAt:
 *           type: string
 *           format: date-time
 */


router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN,UserRole.INTERN]));
// Apply authentication middleware to all certificates routes

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: List user's certificates
 *     description: Retrieve all certificates for the authenticated user
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of certificates
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
 *                     $ref: '#/components/schemas/CertificateWithDetails'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', hasPermission('certificate:read'), listCertificatesController);

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Create a new certificate
 *     description: Generate a certificate for a completed course enrollment
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enrollmentId
 *             properties:
 *               enrollmentId:
 *                 type: integer
 *                 description: ID of the completed enrollment
 *     responses:
 *       201:
 *         description: Certificate created successfully
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
 *                   $ref: '#/components/schemas/Certificate'
 *       400:
 *         description: Bad request (invalid enrollment ID)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', hasPermission('certificate:create'), createCertificateController);

/**
 * @swagger
 * /api/certificates/{enrollmentId}/download:
 *   get:
 *     summary: Download certificate PDF
 *     description: Download the certificate PDF file for a specific enrollment
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the enrollment
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid enrollment ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (certificate doesn't belong to user)
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Internal server error
 */
router.get('/:enrollmentId/download', hasPermission('certificate:download'), downloadCertificateController);

export default router;