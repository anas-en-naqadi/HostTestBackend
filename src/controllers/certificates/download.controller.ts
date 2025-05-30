// src/controllers/certificates/download.controller.ts
import { Request, Response } from 'express';
import fs from 'fs';
import { downloadCertificateService } from '../../services/certificates/download.service';

export const downloadCertificateController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId, 10);
    
    if (isNaN(enrollmentId)) {
      res.status(400).json({
        success: false,
        message: 'Valid enrollment ID is required'
      });
      return;
    }

    // Get the user ID from the authenticated user
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Verify enrollment belongs to the user (this check is done in the service)
    const { filePath, fileName } = await downloadCertificateService(enrollmentId, userId);

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to download certificate'
      });
    }
  }
};
