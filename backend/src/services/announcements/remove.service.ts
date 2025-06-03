import { PrismaClient } from '@prisma/client';
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from "../../utils/cache.utils";

const prisma = new PrismaClient();


export const deleteAnnouncement = async (userId: number, id: number): Promise<void> => {
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: { courses: { include: { user: { select: { id: true,roles:true } } } } },
    });
    if (!announcement || announcement.courses.user.roles.name === "intern") {
      throw new Error("Announcement not found or unauthorized for intern users");
    }

  await prisma.announcements.delete({ where: { id } });

  await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE,`learn-${announcement.courses.slug}`));
  
};