import redis from "config/redis";
import { deleteFromCache, generateCacheKey } from "./cache.utils";

export async function ClearDashboardCache(userId: number) {
  const keys = [
    "user-dashboard-stats",
    "course-suggestions",
    "next-to-learn",
    "dashboard-states",
    // Add the new dashboard cache keys
    "dashboard:full",
    "dashboard:stats",
    "dashboard:performance",
    "dashboard:popular-courses",
  ];
  keys.forEach(async (k) => {
    await deleteFromCache(generateCacheKey(k, userId));
  });
  await deleteFromCache(`enrollments:${userId}:page1:limit3`);
}
