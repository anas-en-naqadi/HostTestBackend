import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { UserRole } from '../types/auth.types';

const prisma = new PrismaClient();

async function seedPermissions() {
  const filePath = path.join(__dirname, '..', 'data', 'permissions.json');
  if (!fs.existsSync(filePath)) throw new Error('permissions.json not found');
  const { permissions } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  await prisma.$transaction(async (tx) => {
    // Upsert permissions
    const upsertedPerms = await Promise.all(
      permissions.map((p: any) =>
        tx.permissions.upsert({
          where: { name: p.name },
          create: { name: p.name, description: p.description },
          update: {}
        })
      )
    );

    // Fetch or error if ADMIN role missing
    const adminRole = await tx.roles.findUnique({
      where: { name: UserRole.ADMIN }
    });
    if (!adminRole) throw new Error('ADMIN role not found');

    // Fetch all admin users
    const adminUsers = await tx.users.findMany({
      where: { role_id: adminRole.id }
    });

    // Upsert role_permissions
    const rpOps = [];
    for (const user of adminUsers) {
      for (const perm of upsertedPerms) {
        rpOps.push(tx.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: user.role_id,
              permission_id: perm.id
            }
          },
          create: {
            role_id: user.role_id,
            permission_id: perm.id
          },
          update: {}
        }));
      }
    }
    await Promise.all(rpOps);
  });

  console.log('🎉 Permission seeding completed successfully');
}

seedPermissions()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
