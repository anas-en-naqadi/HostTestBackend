// src/services/dashboard/dashboardGraphs.service.ts
import { PrismaClient } from '@prisma/client';
import { PerformanceData } from '../../types/dashboard.types';

const prisma = new PrismaClient();

export const getPerformanceData = async (): Promise<PerformanceData[]> => {


 
  const currentDate = new Date();
  const performanceData: PerformanceData[] = [];
  
  // Create weekly data for the last 4 weeks
  for (let i = 0; i < 4; i++) {
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(currentDate.getDate() - (i * 7));
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 7);
    
    // Count trainers (users with trainee role) registered in this week
    const trainersCount = await prisma.users.count({
      where: {
        roles: {
          name: "intern"
        },
        created_at: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });
    
    // Count instructors registered in this week
    const instructorsCount = await prisma.instructors.count({
      where: {
        created_at: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });
    
    performanceData.push({
      week: `Week ${4 - i}`,
      trainers: trainersCount,
      instructors: instructorsCount
    });
  }
  
  // Reverse array to have chronological order (oldest week first)
  performanceData.reverse();
  
  return performanceData;
};