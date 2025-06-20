// src/controllers/certificates/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getCertificates } from '../../services/certificates/list.service';
import { AppError } from '../../middleware/error.middleware';
import { errorResponse, successResponse } from '../../utils/api.utils';
import { logActivity } from '../../utils/activity_log.utils';

export const listCertificatesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Get user ID from authenticated user
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = user.id;
    const certificates = await getCertificates(userId);
    console.log("certificates", certificates)

    // Log certificate list viewing activity
    logActivity(
      userId,
      'CERTIFICATES_VIEWED',
      `${user.full_name} viewed their certificates list (${certificates.length || 0} certificates)`,
      req.ip
    ).catch(console.error);

    successResponse(res, certificates, 'Certificates retrieved successfully', 200);
  } catch (error) {
    if (error instanceof AppError) {
      errorResponse(res, 'Failed to retrieve certificates', 500, error.errors);
    } else {
      console.error('List certificates error:', error);
      errorResponse(res, 'Failed to retrieve certificates', 500, error);
    }
  }
};