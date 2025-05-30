// src/services/role/assign_permission.service.ts

import { PrismaClient, Prisma } from "@prisma/client";
import { AssignPermissionDto } from "../../types/role.types";
import { AppError } from "../../middleware/error.middleware";

const prisma = new PrismaClient();

/**
 * Service to assign a permission to a role
 * @param dto { role_id, permission_id }
 * @throws AppError on conflict or other failures
 */
export const assignPermission = async (dto: AssignPermissionDto[]): Promise<void> => {
  try {
    const roleIds = [...new Set(dto.map((item) => item.role_id))];
    const permissionIds = [...new Set(dto.map((item) => item.permission_id))];

    const existingRoles = await prisma.roles.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });
    const existingPermissions = await prisma.permissions.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });

    const existingRoleIds = new Set(existingRoles.map((r) => r.id));
    const existingPermissionIds = new Set(existingPermissions.map((p) => p.id));

    for (const item of dto) {
      if (!existingRoleIds.has(item.role_id)) {
        throw new AppError(404, `Role with ID ${item.role_id} not found`);
      }
      if (!existingPermissionIds.has(item.permission_id)) {
        throw new AppError(404, `Permission with ID ${item.permission_id} not found`);
      }
    }

    await prisma.role_permissions.createMany({
      data: dto,
      skipDuplicates: true, // avoids error if permission already assigned
    });


  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(409, "Permission already assigned to this role");
    }
    console.error(err);
    throw new AppError(500, "Could not assign permission to role");
  }
};
