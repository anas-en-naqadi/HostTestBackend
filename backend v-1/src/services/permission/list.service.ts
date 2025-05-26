import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const listPermissionsService = async () => {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return {
      success: true,
      message: 'Permissions retrieved successfully',
      data: permissions
    };
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw new Error('Failed to fetch permissions');
  }
};

export const getPermissionByIdService = async (id: number) => {
  try {
    const permission = await prisma.permissions.findUnique({
      where: { id }
    });

    if (!permission) {
      return {
        success: false,
        message: 'Permission not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Permission retrieved successfully',
      data: permission
    };
  } catch (error) {
    console.error('Error fetching permission:', error);
    throw new Error('Failed to fetch permission');
  }
};
