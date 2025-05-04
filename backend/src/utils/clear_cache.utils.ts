import redis from "config/redis";
import {
    deleteFromCache,
    generateCacheKey,
  } from "./cache.utils";

export async function ClearDashboardCache(userId:number){
    const keys = [
        "user-dashboard-stats",
        "course-suggestions",
        "next-to-learn",
        "dashboard-states"
    ]
    keys.forEach(async (k)=>{
        await deleteFromCache(
            generateCacheKey(k, userId)
          );
    });
    await deleteFromCache(
        `enrollments:${userId}:page1:limit3`
      );
  
}
