import { Request, Response } from 'express';
import { listPermissionsService, getPermissionByIdService } from '../../services/permission/list.service';

export const listPermissionsController = async (req: Request, res: Response) => {
  try {
    const result = await listPermissionsService();
     res.status(200).json(result);
  } catch (error) {
    console.error('Error in listPermissionsController:', error);
     res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      data: null
    });
  }
};

export const getPermissionByIdController = async (req: Request, res: Response) => {
  try {
    const permissionId = parseInt(req.params.id);
    
    if (isNaN(permissionId)) {
       res.status(400).json({
        success: false,
        message: 'Invalid permission ID',
        data: null
      });
    }
    
    const result = await getPermissionByIdService(permissionId);
    
    if (!result.success) {
       res.status(404).json(result);
    }
    
     res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPermissionByIdController:', error);
     res.status(500).json({
      success: false,
      message: 'Failed to fetch permission',
      data: null
    });
  }
};
