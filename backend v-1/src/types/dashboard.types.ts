// src/types/dashboard.types.ts
export interface DashboardStatsResponse {
  trainers: number;
  instructors: number;
  courses: number;
  categories: number;
  activeInterns: number;
  activeInstructors: number;
}

export interface PopularCourse {
  id: string;
  thumbnail: string;
  title: string;
  participants: number;
}

export interface PerformanceData {
  week: string;
  trainers: number;
  instructors: number;
}

export interface DashboardResponse {
  stats: DashboardStatsResponse;
  popularCourses: PopularCourse[];
  performanceData: PerformanceData[];
}
