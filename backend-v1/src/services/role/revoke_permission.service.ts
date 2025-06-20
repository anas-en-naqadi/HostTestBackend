// src/services/role/assign_permission.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { AssignPermissionDto } from '../../types/role.types';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Service to assign a permission to a role
 * @param dto { role_id, permission_id }
 * @throws AppError on conflict or other failures
 */
export const revokePermission = async (dto: AssignPermissionDto[]): Promise<void> => {
  try {
    for (const item of dto) {
      const roleExists = await prisma.roles.findUnique({ where: { id: item.role_id } });
      if (!roleExists) throw new AppError(404, `Role with ID ${item.role_id} not found`);
    
      const permissionExists = await prisma.permissions.findUnique({ where: { id: item.permission_id } });
      if (!permissionExists) throw new AppError(404, `Permission with ID ${item.permission_id} not found`);

      await prisma.role_permissions.delete({
        where: {
          role_id_permission_id: {
            role_id: item.role_id,
            permission_id: item.permission_id
          }
        }
      });
    }


  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Permission already assigned to this role');
    }
    throw new AppError(500, 'Could not revoke permission(s) from role');
  }
};
