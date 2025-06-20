import { Request, Response } from 'express';
import { listPermissionsService, getPermissionByIdService } from '../../services/permission/list.service';
import { logActivity } from '../../utils/activity_log.utils';

export const listPermissionsController = async (req: Request, res: Response) => {
  try {
    const result = await listPermissionsService();
    
    // Log activity if user is authenticated
    if (req.user) {
      logActivity(
        req.user.id,
        'PERMISSIONS_LISTED',
        `${req.user.full_name} viewed permissions list (${result.data?.length || 0} items)`,
        req.ip
      ).catch(console.error);
    }
    
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
       return;
    }
    
    // Log activity if user is authenticated
    if (req.user && result.data) {
      logActivity(
        req.user.id,
        'PERMISSION_VIEWED',
        `${req.user.full_name} viewed permission: ${result.data.name} (ID: ${permissionId})`,
        req.ip
      ).catch(console.error);
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
